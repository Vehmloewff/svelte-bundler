export interface BundleOptions {
	/** The file to start out bundling.
	 * Must be in absolute url form.  Examples:
	 * - file:///home/jack/project/main.js
	 * - http://example.com/myfile.js
	 * - virtual://entry.js
	 */
	input?: string
	/** When a file is required, even if it is an entry file, it will first be looked up in this map.
	 * If it is not found, 'provideFile' will be called.
	 *
	 * ```ts
	 * await bundle({
	 * 	input: 'virtual://entry.js',
	 * 	map: {
	 * 		'virtual://entry.js': 'import App from \'./App.svelte\'...',
	 * 		'virtual://App.svelte': '<script>...',
	 * 	}
	 * })
	 * ```
	 */
	map?: Record<string, string>
	/** Insert extra runtime checks into the svelte output */
	dev?: boolean
	/** Called right after a svelte file is compiled.  If a promise is returned, it will be awaited. */
	onSvelteCompile?(url: string): unknown
	/** Where files are looked up when not found in 'map'
	 * Return null if the file does not exist */
	provideFile?(url: string): string | null
}

export interface BundleResult {
	/** The bundled javascript output */
	js: string
	/** Any CSS that svelte components include will be bundled in here */
	css: string
	sourceMap: string
	/** All the files in this graph */
	files: string[]
	/** The warnings generated while compiling svelte code */
	diagnostics: Deno.Diagnostic[]
}

export function bundle(options?: BundleOptions): Promise<BundleResult>
