import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const notifications = [];
const handlers = {};
let closeCalls = 0;
globalThis.__aventusCliWatcher = { notifications };
const result = await build({ entryPoints: ['cli/src/file-system/FileSystem.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'watcher-doubles', setup(build) {
    build.onResolve({ filter: /^chokidar$|^@server\// }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => {
      if (args.path === 'chokidar') return { contents: 'export const watch = globalThis.__aventusCliWatcher.watch;', loader: 'js' };
      if (args.path === '@server/tools') return { contents: 'export const pathToUri = path => "file:///" + path;', loader: 'js' };
      const name = args.path.split('/').at(-1);
      return { contents: `export const ${name} = { run: uri => globalThis.__aventusCliWatcher.notifications.push(['${name}', uri]) };`, loader: 'js' };
    });
  } }],
});
globalThis.__aventusCliWatcher.watch = (pattern, options) => {
  globalThis.__aventusCliWatcher.pattern = pattern;
  globalThis.__aventusCliWatcher.options = options;
  return { on(name, callback) { handlers[name] = callback; return this; }, async close() { closeCalls++; } };
};
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
const { FilesWatcher } = module.exports;

test('CLI watcher coalesces transitions and emits deletion before creation and update', async () => {
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const scheduled = [];
  globalThis.setTimeout = callback => { scheduled.push(callback); return scheduled.length; };
  globalThis.clearTimeout = () => {};
  try {
    const watcher = new FilesWatcher('D:/project');
    assert.equal(globalThis.__aventusCliWatcher.pattern, 'D:/project');
    assert.equal(globalThis.__aventusCliWatcher.options.persistent, true);
    await handlers.add('new.avt');
    await handlers.change('new.avt');
    await handlers.change('updated.avt');
    await handlers.add('ignored.txt');
    await handlers.add('removed.avt');
    await handlers.unlink('removed.avt');
    await watcher.sendStack();
    assert.deepEqual(notifications, [
      ['FileDeleted', 'file:///removed.avt'],
      ['FileCreated', 'file:///new.avt'],
      ['FileUpdated', 'file:///updated.avt'],
    ]);
    assert.equal(scheduled.length, 5);
    assert.equal(closeCalls, 0);
    await watcher.stop();
    assert.equal(closeCalls, 1);
  } finally { globalThis.setTimeout = originalSetTimeout; globalThis.clearTimeout = originalClearTimeout; }
});

test('CLI watcher stop cancels pending notifications and ignores later events', async () => {
  notifications.length = 0;
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const scheduled = [];
  const cancelled = [];
  globalThis.setTimeout = callback => { scheduled.push(callback); return scheduled.length; };
  globalThis.clearTimeout = timer => cancelled.push(timer);
  try {
    const watcher = new FilesWatcher('D:/project');
    await handlers.add('pending.avt');
    const closing = watcher.stop();
    assert.equal(watcher.stop(), closing);
    await closing;
    assert.equal(closeCalls, 2);
    assert.ok(cancelled.includes(1));
    scheduled[0]();
    await handlers.change('later.avt');
    await watcher.sendStack();
    assert.deepEqual(notifications, []);
  } finally { globalThis.setTimeout = originalSetTimeout; globalThis.clearTimeout = originalClearTimeout; }
});
