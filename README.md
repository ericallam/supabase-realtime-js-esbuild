## Reproduction of `@supabase/realtime-js` type & ESM/CJS issues

Currently, it's not possible to use `@supabase/realtime-js` in a TypeScript project that uses NodeNext/Node16 module resolution. For more information about the issues with the types in this package, please refer to the [Are the types wrong?](https://arethetypeswrong.github.io/?p=%40supabase%2Frealtime-js%402.10.5) output.

There's also an issue with `@supabase/realtime-js` module resolution, when using ESM in Node.js. Because `realtime-js` "identifies" as a `"type": "module"` package, when resolving the javascript file to load when bundling for ESM, it will resolve to the `main` field, which points to `/node_modules/@supabase/realtime-js/dist/main/index.js`. This is a problem because `/node_modules/@supabase/realtime-js/dist/main/index.js` is a CJS module, not an ESM module. The ESM module is located under the `"module"` field, which points to `/node_modules/@supabase/realtime-js/dist/module/index.js`.

## Steps to reproduce issues

1. Clone this repository
2. Create a `.env` file with the following content:

```
SUPABASE_URL=https://<your-supabase-url>.supabase.co
SUPABASE_KEY=<your-supabase-key>
```

3. Use Node 22 or later (to get the `--env-file` support) (e.g. `nvm use 22`)
4. Install dependencies using `npm install`

### Scenario 1: NodeNext/Node16 module resolution in tsconfig.json

Open the `src/index.ts` file and hover over the `RealtimeClient` import. You'll see that the type is not being inferred correctly (or at all).

If you rename `tsconfig.json` to `tsconfig.json.bak`, and `tsconfig.cjs.json` to `tsconfig.json`, you'll see that the type is inferred correctly.

### Scenario 2: ESM module resolution in Node.js when bundling with esbuild

1. Build the project using `npm run build:esm:nofix`
2. Run the project using `npm run start:esm`

You'll see the following error:

```
file:///Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/dist/index.mjs:7836
    Object.defineProperty(exports, "__esModule", { value: true });
                          ^

ReferenceError: exports is not defined in ES module scope
    at node_modules/@supabase/realtime-js/dist/main/RealtimeClient.js (file:///Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/dist/index.mjs:7836:27)
    at __init (file:///Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/dist/index.mjs:14:56)
    at node_modules/@supabase/realtime-js/dist/main/index.js (file:///Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/dist/index.mjs:8268:46)
    at __require2 (file:///Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/dist/index.mjs:17:50)
    at file:///Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/dist/index.mjs:8293:34
    at ModuleJob.run (node:internal/modules/esm/module_job:262:25)
    at async ModuleLoader.import (node:internal/modules/esm/loader:474:24)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:109:5)
```

This is because the `@supabase/realtime-js` package is resolving to the CJS module (`@supabase/realtime-js/dist/main/index.js`).

3. Now run the project using `npm run build:esm:fix`

You'll see a log showing how we fixed the issue by pointing to the correct ESM module using an esbuild plugin:

```
Applying fix to @supabase/realtime-js path resolution {
  original: '/Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/node_modules/@supabase/realtime-js/dist/main/index.js',
  resolvedPath: '/Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/node_modules/@supabase/realtime-js/dist/module/index.js'
}
```

4. Run the project again using `npm run start:esm`

You should see something like:

```
(node:64355) [UNDICI-WS] Warning: WebSockets are experimental, expect them to change at any time.
(Use `node --trace-warnings ...` to show where the warning was created)
There was an error subscribing to channel: undefined
Realtime server did not respond in time.
```

Which means things are working correctly now.

5. You can also fix by editing the `package.json` inside `node_modules/@supabase/realtime-js` and removing the `"type": "module"` field, which will make the package resolve correctly.:

```sh
npm run build:esm:nofix
npm run start:esm
```

### Scenario 3: ESM module resolution in Node.js when bundling with esbuild (and keeping `@supabase/realtime-js` external)

1. Build the project using `npm run build:esm:nofix:external`
2. Run the project using `npm run start:esm`

You'll see the following error:

```
file:///Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/dist/index.mjs:2
import { RealtimeClient } from "/Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/node_modules/@supabase/realtime-js/dist/main/index.js";
         ^^^^^^^^^^^^^^
SyntaxError: The requested module '/Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/node_modules/@supabase/realtime-js/dist/main/index.js' does not provide an export named 'RealtimeClient'
    at ModuleJob._instantiate (node:internal/modules/esm/module_job:171:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:254:5)
    at async ModuleLoader.import (node:internal/modules/esm/loader:474:24)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:109:5)
```

This is happening because again, the `@supabase/realtime-js` package is resolving to the CJS module (`@supabase/realtime-js/dist/main/index.js`).

3. Now run the project using `npm run build:esm:fix:external`
4. Run the project again using `npm run start:esm`

Now we've fixed the resolution issue, but we're getting a new error:

```
node:internal/modules/esm/resolve:260
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/node_modules/@supabase/realtime-js/dist/module/RealtimeClient' imported from /Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/node_modules/@supabase/realtime-js/dist/module/index.js
    at finalizeResolution (node:internal/modules/esm/resolve:260:11)
    at moduleResolve (node:internal/modules/esm/resolve:920:10)
    at defaultResolve (node:internal/modules/esm/resolve:1119:11)
    at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:541:12)
    at ModuleLoader.resolve (node:internal/modules/esm/loader:510:25)
    at ModuleLoader.getModuleJob (node:internal/modules/esm/loader:240:38)
    at ModuleJob._link (node:internal/modules/esm/module_job:126:49) {
  code: 'ERR_MODULE_NOT_FOUND',
  url: 'file:///Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/node_modules/@supabase/realtime-js/dist/module/RealtimeClient'
}
```

This is because `dist/module/index.js` does an import of `RealtimeClient` without specifying the extension, and Node.js is not able to resolve it correctly:

```js
import RealtimeClient from "./RealtimeClient";
```

5. Again, if you remove the `"type": "module"` field from the `package.json` inside `node_modules/@supabase/realtime-js`, the package will resolve correctly:

```sh
npm run build:esm:nofix:external
npm run start:esm
```

### Scenario 4: Bundling with to CJS with esbuild

1. Build the project using `npm run build:cjs`, which tries to bundle the project to CJS (and using the `tsconfig.cjs.json` file as well), which outputs this warning:

```
▲ [WARNING] Import "RealtimeClient" will always be undefined because the file "node_modules/@supabase/realtime-js/dist/main/index.js" has no exports [import-is-undefined]

    src/index.ts:1:9:
      1 │ import { RealtimeClient } from "@supabase/realtime-js";
```

2. Now run the project using `npm run start:cjs`

And sure enough, you'll see the following error:

```
/Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/dist/index.cjs:8273
var client = new (void 0)(process.env.SUPABASE_URL, {
             ^

TypeError: (void 0) is not a constructor
    at Object.<anonymous> (/Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/dist/index.cjs:8273:14)
    at Module._compile (node:internal/modules/cjs/loader:1460:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1544:10)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Module._load (node:internal/modules/cjs/loader:1091:12)
    at wrapModuleLoad (node:internal/modules/cjs/loader:212:19)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:158:5)
    at node:internal/main/run_main_module:30:49
```

Externalizing the `@supabase/realtime-js` package doesn't work in this case, which you can see by running `npm run build:cjs:external` and then `npm run start:cjs`, which gives this error:

```
var import_realtime_js = require("@supabase/realtime-js");
                         ^

Error [ERR_REQUIRE_ESM]: require() of ES Module /Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/node_modules/@supabase/realtime-js/dist/main/index.js from /Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/dist/index.cjs not supported.
index.js is treated as an ES module file as it is a .js file whose nearest parent package.json contains "type": "module" which declares all .js files in that package scope as ES modules.
Instead either rename index.js to end in .cjs, change the requiring code to use dynamic import() which is available in all CommonJS modules, or change "type": "module" to "type": "commonjs" in /Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/node_modules/@supabase/realtime-js/package.json to treat all .js files as CommonJS (using .mjs for all ES modules instead).

    at Object.<anonymous> (/Users/eric/code/triggerdotdev/reproductions/supabase-realtime-js-esbuild/dist/index.cjs:4:26) {
  code: 'ERR_REQUIRE_ESM'
}
```

The only fix is to remove the `"type": "module"` field from the `package.json` inside `node_modules/@supabase/realtime-js`:

```sh
npm run build:cjs
npm run start:cjs
```
