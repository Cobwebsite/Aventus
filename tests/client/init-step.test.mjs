import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const events = [];
globalThis.__aventusInitStepTest = { events };
const result = await build({ entryPoints: ['client/src/notification/InitStep.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'init-doubles', setup(build) {
    build.onResolve({ filter: /\.\.\/Singleton$|\.\/Compiled$/ }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: args.path.endsWith('Singleton')
      ? 'export const Singleton = { client: { components: { setLastCompiledInfo: info => globalThis.__aventusInitStepTest.events.push(["status", info]) }, initDone: () => globalThis.__aventusInitStepTest.events.push(["initDone"]), startFileSystem: () => globalThis.__aventusInitStepTest.events.push(["startFileSystem"]) } };'
      : 'export const Compiled = { render: () => globalThis.__aventusInitStepTest.events.push(["render"]) };', loader: 'js' }));
  } }],
});
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
const { InitStep } = module.exports;

test('init step marks completion, starts file system and schedules compiled status render', () => {
  const originalSetTimeout = globalThis.setTimeout;
  const timers = [];
  globalThis.setTimeout = (callback, ms) => { timers.push([callback, ms]); return timers.length; };
  try {
    InitStep.action('Aventus : Loading');
    assert.equal(InitStep.isDone, false);
    assert.deepEqual(events, [['status', { text: 'Aventus : Loading' }]]);
    InitStep.action('Aventus : Done');
    assert.equal(InitStep.isDone, true);
    assert.deepEqual(events.slice(1), [
      ['status', { text: 'Aventus : Done' }], ['initDone'], ['startFileSystem'],
    ]);
    assert.equal(timers.length, 1);
    assert.equal(timers[0][1], 5000);
    timers[0][0]();
    assert.deepEqual(events.at(-1), ['render']);
  } finally { globalThis.setTimeout = originalSetTimeout; }
});
