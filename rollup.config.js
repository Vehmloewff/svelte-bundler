import resolve from '@rollup/plugin-node-resolve'

export default {
	input: 'index.mjs',
	plugins: [resolve()],
	output: {
		file: 'svelte-bundler.js',
		format: 'esm',
	},
}
