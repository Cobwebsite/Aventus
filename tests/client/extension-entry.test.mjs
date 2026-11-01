import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const events = [];
globalThis.__aventusExtensionEntry = { events };
const result = await build({ entryPoints: ['client/src/index.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'singleton-double', setup(build) {
    build.onResolve({ filter: /^\.\/Singleton$/ }, () => ({ path: 'singleton', namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const Singleton = { client: { async init(context) { globalThis.__aventusExtensionEntry.events.push(["init", context]); }, async stop() { globalThis.__aventusExtensionEntry.events.push(["stop"]); } } };', loader: 'js' }));
  } }],
});
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
const { activate, deactivate } = module.exports;

test('extension entry awaits client initialization and returns client shutdown', async () => {
  const context = { id: 'extension', subscriptions: [] };
  await activate(context);
  assert.deepEqual(events, [['init', context]]);
  await deactivate();
  assert.deepEqual(events, [['init', context], ['stop']]);
});
