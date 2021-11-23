import { rollup } from 'rollup'
import { compile as compileSvelte } from 'svelte/compiler'
import commonjs from './commonjs.mjs'

export async function bundle(options) {
	const map = { ...options.map } || {}
	const input = options.input || 'virtual:///main.js'
	const provideFile =
		options.provideFile ||
		(() => {
			throw new Error('cannot provide file.  No "provideFile" option was set on bundle')
		})
	const onSvelteCompile = options.onSvelteCompile || (() => {})
	const dev = options.dev || false

	const diagnostics = []
	const cssSections = []

	async function canLoad(id) {
		if (map[id]) return true

		const protocol = getProtocol(id)
		if (protocol === 'virtual') throw new Error('all virtual modules must be provided in the "map" option of bundle')

		const file = await provideFile(id)
		if (file) {
			map[id] = file
			return true
		}

		return false
	}

	async function resolve(id, importer) {
		const extension = importer ? getExtension(importer) : 'js'

		const resolvePkgJson = async (base, pkgJson) => {
			const pkgPath = `${base}/package.json`

			if (pkgJson.svelte) return await resolve(fixLazyPath(pkgJson.svelte), pkgPath)
			if (pkgJson.module) return await resolve(fixLazyPath(pkgJson.module), pkgPath)
			if (pkgJson.main) return await resolve(fixLazyPath(pkgJson.main), pkgPath)

			return `${base}/index.${extension}`
		}

		if (id.endsWith('/')) return await resolve(id.slice(0, -1), importer)

		// If the file has protocol, try to load it
		if (hasProtocol(id)) {
			// If the file already has an extension, try to load it
			if (getExtension(id)) {
				const didLoad = await canLoad(id)
				if (didLoad) return id
			}
			// That didn't work, try with the extension
			else {
				const didLoad = await canLoad(`${id}.${extension}`)
				if (didLoad) return id
			}

			// That didn't work, so this must be a directory.  Look for a package.json
			{
				const pkgPath = `${id}/package.json`

				const didLoad = await canLoad(pkgPath)
				if (didLoad) return resolvePkgJson(id, JSON.parse(map[pkgPath]))
			}

			// Ok, there is no package.json in this directory.  Look for an index file
			{
				const didLoad = await canLoad(`${id}/index.${extension}`)
				if (didLoad) return id
			}

			// Ok, there is no index.js in this directory.  WHAT A WASTE OF TIME!!!
			throw new Error(`cannot resolve ${id} from ${importer}`)
		}

		if (noSwitchProtocol(id)) {
			if (!importer) throw new Error('input must be a valid entry.  Did you forget to prefix it with "virtual://"?')

			const defaultProtocol = getProtocol(importer)
			if (isAbsolute(id)) return resolve(`${defaultProtocol}://${id}`, importer)

			return resolve(`${defaultProtocol}://${relativeTo(id, importer)}`, importer)
		}

		// it is an npm module
		const pkgBase = `https://unpkg.com/${id}`

		return await resolvePkgJson(pkgBase, JSON.parse(await provideFile(`${pkgBase}/package.json`)))
	}

	function load(id) {
		const extension = getExtension(id)

		const code = map[id]
		if (!code) throw new Error('a file was loaded that was never resolved')

		if (extension === 'json') return `export default ${code}`
		if (extension === 'txt') return `export default ${JSON.stringify(code)}`

		return code
	}

	async function transform(code, id) {
		if (getExtension(id) !== 'svelte') return null

		await onSvelteCompile(id)

		const { js, css, warnings } = compileSvelte(code, { filename: id, dev })

		cssSections.push(css.code)
		diagnostics.push(...warnings)

		return {
			code: js.code,
			map: js.map,
		}
	}

	const plugin = {
		name: 'svelte-bundler',
		resolveId: resolve,
		load,
		transform,
	}

	const bundle = await rollup({ input, plugins: [plugin, commonjs] })
	const { output } = await bundle.generate({ format: 'esm', sourcemap: true })
	const { code, map: sourceMap } = output[0]
	await bundle.close()

	return {
		js: code,
		css: cssSections.join('\n\n'),
		sourceMap,
		diagnostics: mapDiagnostics(diagnostics),
		files: bundle.watchFiles,
	}
}

function getExtension(id) {
	const sections = id.split('/')
	const file = sections[sections.length - 1]
	const fileParts = file.split('.')

	if (fileParts.length >= 2) return fileParts[fileParts.length - 1]

	return null
}

function fixLazyPath(id) {
	if (id.startsWith('.')) return id

	return `./${id}`
}

function getProtocol(id) {
	const protocol = id.split('://')

	if (protocol.length >= 2) return protocol[0]

	throw new Error(`no protocol was found on id: ${id}`)
}

function withoutProtocol(id) {
	const protocol = id.split('://')

	if (protocol.length >= 2) return protocol[1]

	throw new Error(`no protocol was found on id: ${id}`)
}

function hasProtocol(id) {
	return id.indexOf('://') !== -1
}

function isAbsolute(id) {
	return id.startsWith('/')
}

function noSwitchProtocol(id) {
	return isAbsolute(id) || id.startsWith('./') || id.startsWith('../')
}

function relativeTo(path, location) {
	const absoluteLocation = withoutProtocol(location)
	const segments = absoluteLocation.split('/')

	segments[segments.length - 1] = path

	return normalizePath(segments.join('/'))
}

function normalizePath(path) {
	const segments = path.split('/')
	const normalizedSegments = []

	for (const segment of segments) {
		if (segment === '..') normalizedSegments.pop()
		else if (segment.length && segment !== '.') normalizedSegments.push(segment)
	}

	const joined = normalizedSegments.join('/')

	if (path.startsWith('/')) return `/${joined}`

	return joined
}

function mapDiagnostics(diagnostics) {
	return diagnostics.map((diagnostic, i) => ({
		messageText: diagnostic.message,
		sourceLine: diagnostic.frame,
		start: { line: diagnostic.start.line, character: diagnostic.start.column - 1 },
		end: { line: diagnostic.end.line, character: diagnostic.end.column - 1 },
		filename: diagnostic.filename,
		category: 0,
		code: i,
	}))
}
