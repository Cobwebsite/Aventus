import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const events = [];
globalThis.__aventusRealServerTest = { events };
const result = await build({ entryPoints: ['cli/src/server/RealServer.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'real-server-doubles', setup(build) {
    build.onResolve({ filter: /^@server\/GenericServer$|^@server\/cmds\/Create$|^@server\/tools$|^\.\/Connection$|^\.\.\/file-system\/FileSystem$|^\.\/notification\/Statistics$/ }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: ({
      '@server/GenericServer': 'export class GenericServer { constructor(connection) { globalThis.__aventusRealServerTest.events.push("construct"); } start() { globalThis.__aventusRealServerTest.events.push("start"); if (globalThis.__aventusRealServerTest.failStart) throw new Error("start failed"); } }',
      '@server/cmds/Create': 'export const Create = { run: async () => {} };',
      '@server/tools': 'export const pathToUri = path => path;',
      './Connection': 'export class CliConnection { constructor(config) { this.config = config; this._connection = { stop() {} }; this.errorsByBuildByFile = {}; } }',
      '../file-system/FileSystem': 'export class FilesWatcher { constructor() {} }',
      './notification/Statistics': 'export const Statistics = { info: { loadFileTime: 0, builds: {}, statics: {}, files: {} } };',
    })[args.path], loader: 'js' }));
  } }],
});
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
const { RealServer } = module.exports;

test('real server start waits for init notification on its first start', async () => {
  const pending = RealServer.start({ noStart: false });
  assert.deepEqual(events, ['construct', 'start']);
  RealServer.started();
  await pending;
  assert.equal(RealServer.waitingStart, null);
});

test('real server repeated start currently leaves its promise pending', async () => {
  const second = RealServer.start({ noStart: true });
  const outcome = await Promise.race([
    second.then(() => 'resolved'),
    new Promise(resolve => setTimeout(() => resolve('pending'), 20)),
  ]);
  assert.equal(outcome, 'pending');
  assert.deepEqual(events, ['construct', 'start']);
});

test('real server catches a startup exception but leaves the caller waiting', async () => {
  RealServer.server = null;
  globalThis.__aventusRealServerTest.failStart = true;
  const originalLog = console.log;
  const logged = [];
  console.log = error => logged.push(error);
  try {
    const pending = RealServer.start({});
    const outcome = await Promise.race([
      pending.then(() => 'resolved'),
      new Promise(resolve => setTimeout(() => resolve('pending'), 20)),
    ]);
    assert.equal(outcome, 'pending');
    assert.equal(logged[0].message, 'start failed');
  } finally {
    console.log = originalLog;
    globalThis.__aventusRealServerTest.failStart = false;
  }
});
