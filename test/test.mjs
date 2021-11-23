import { readFileSync, readdirSync, writeFileSync } from 'fs'
import fetch from 'node-fetch'
import { bundle } from '../index.mjs'
;(async function () {
	const files = readdirSync('test/cases')

	for (const example of files) {
		console.log(`Running test ${example}...`)

		const pkgJson = JSON.parse(readFileSync(`test/cases/${example}/package.json`, 'utf-8'))
		const lazyEntry = pkgJson.svelte
		const entry = `file://${process.cwd()}/test/cases/${example}/${lazyEntry}`

		const { js, css, diagnostics, map } = await bundle({
			input: entry,
			async provideFile(url) {
				if (url.startsWith('file://')) {
					const path = url.slice(7) // remove the file:// part

					try {
						const file = readFileSync(path, 'utf-8')
						console.log(`Read ${url}`)

						return file
					} catch (e) {
						return null
					}
				} else
					return await fetch(url).then(async res => {
						if (!res.ok) return null

						console.log(`Download ${url}`)

						return await res.text()
					})
			},
			onSvelteCompile(id) {
				console.log(`Compile ${id}`)
			},
		})

		writeFileSync(`test/cases/${example}/bundle.js`, js, 'utf-8')
		writeFileSync(`test/cases/${example}/bundle.css`, css, 'utf-8')

		if (diagnostics.length) console.log(diagnostics)
	}
})()
