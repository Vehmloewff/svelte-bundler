# Svelte Bundler

A bundler for Svelte Applications.

For documentation, see [`deno.ts`](./deno.ts).

## Why on earth do we need this?

TODO

## Methodology

TODO

## NodeJS

Download `svelte-bundler.js` into your project, and include it like so:

```js
import { bundle } from './svelte-bundler'

(async function(){
	const { js, css, sourceMap } = await bundle({ input: 'App.svelte' })
}())
```

## Deno

```ts
import { bundle } from 'https://github.com/Vehmloewff/svelte-bundler/deno.ts'

const { js, css, sourceMap } = await bundle({ input: 'App.svelte' })
```
