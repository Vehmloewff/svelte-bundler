# Svelte Bundler

A bundler for Svelte Applications.

For documentation, see [`types.d.ts`](./deno.ts).

## Why on earth do we need this?

There are already lots of ways to bundle a svelte application, but this is not just “another guy on the corner”.

Svelte Bundler does not require a configuration file, nor does it ship with a complicated list of options.  It does not handle file system or http calls, that is outsourced to the provideFile function.  It simply ships a single esm file that handles the complex logic of bundling the project, compiling the svelte code on the fly.  It can be run anywhere, in NodeJS, in the browser, or in Deno.

This bundler seeks to operate similar to the one in the Svelte Repl, where NPM modules are not required to be downloaded, but simply fetched from https://unpkg.com.

With its opinionated design, this bundler is clearly not for everyone, but when it does fit your use case, it’ll fit well.

## Notice

All svelte files, even virtual ones included in `options.map` must contain a `.svelte` extension, or they will not be compiled.

## NodeJS

Download `svelte-bundler.js` into your project...

```
curl -o svelte-bundler.js https://denopkg.com/Vehmloewff/svelte-bundler@1.0.0/svelte-bundler.js
```

...and include it like so:

```js
import { bundle } from './svelte-bundler'

(async function(){
	const { js, css, sourceMap } = await bundle({ input: 'App.svelte' })
}())
```

## Deno

```ts
import { bundle } from 'https://denopkg.com/Vehmloewff/svelte-bundler@1.0.0/deno.ts'

const { js, css, sourceMap } = await bundle({ input: 'App.svelte' })
```
