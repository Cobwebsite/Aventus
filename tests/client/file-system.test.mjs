import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const events = [];
const callbacks = {};
let watcherDisposed = false;
let renameDisposed = false;
let deleteDisposed = false;
const workspace = {
  createFileSystemWatcher(pattern) {
    events.push(['watch', pattern]);
    return {
      onDidCreate(callback) { callbacks.create = callback; },
      onDidChange(callback) { callbacks.change = callback; },
      onDidDelete(callback) { callbacks.delete = callback; },
      dispose() { watcherDisposed = true; },
    };
  },
  onWillRenameFiles(callback, context) {
    callbacks.rename = event => callback.call(context, event);
    return { dispose() { renameDisposed = true; } };
  },
  onDidDeleteFiles(callback) {
    callbacks.deleteFiles = callback;
    return { dispose() { deleteDisposed = true; } };
  },
};
globalThis.__aventusFsTest = { events };
const result = await build({ entryPoints: ['client/src/file-system/FileSystem.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'fs-doubles', setup(build) {
    build.onResolve({ filter: /\.\.\/cmds\/file-system\/|\.\.\/cmds\/Rename$|\.\.\/manifest\/AutoLoader$/ }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => {
      const name = args.path.split('/').at(-1);
      return { contents: name === 'AutoLoader'
        ? 'export const AutoLoader = { htmlManifest: "custom-data.json", emmetManifest: "emmet.json", getInstance: () => ({ register: async () => {} }) };'
        : `export const ${name} = { execute: (...args) => globalThis.__aventusFsTest.events.push(['${name}', ...args]) };`, loader: 'js' };
    });
  } }],
});
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? { workspace } : require(name));
const { FileSystem } = module.exports;
const uri = text => ({ toString: () => text });

test('file watcher collapses create/change/delete transitions and flushes notifications', async () => {
  const fs = new FileSystem();
  assert.match(events[0][1], /\.avt/);
  await callbacks.create(uri('file:///one.avt'));
  await callbacks.change(uri('file:///one.avt'));
  await fs.sendStack();
  assert.deepEqual(events.slice(1), [['FileBatch', { created: ['file:///one.avt'], updated: [], deleted: [] }]]);
  events.length = 0;
  await callbacks.change(uri('file:///one.avt'));
  await callbacks.delete(uri('file:///one.avt'));
  await fs.sendStack();
  assert.deepEqual(events, [['FileBatch', { created: [], updated: [], deleted: ['file:///one.avt'] }]]);
  fs.stop();
  assert.equal(watcherDisposed, true);
});

test('rename listener is disposed when file watcher stops', () => {
  const fs = new FileSystem();
  fs.stop();
  assert.equal(renameDisposed, true);
  assert.equal(deleteDisposed, true);
  const files = [{ oldUri: uri('file:///old.avt'), newUri: uri('file:///new.avt') }];
  callbacks.rename({ files });
  assert.notDeepEqual(events.at(-1), ['Rename', files]);
});

test('deleting a folder in the VS Code explorer forwards its URI once', async () => {
  const fs = new FileSystem();
  events.length = 0;
  callbacks.deleteFiles({ files: [uri('file:///project/src/BillGenerator')] });
  await new Promise(resolve => setImmediate(resolve));
  await fs.sendStack();
  assert.deepEqual(events, [['FileBatch', { created: [], updated: [], deleted: ['file:///project/src/BillGenerator'] }]]);
  fs.stop();
});

test('queued file notification is cancelled when watcher stops', async () => {
  events.length = 0;
  const scheduled = [];
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  globalThis.setTimeout = callback => { scheduled.push(callback); return scheduled.length; };
  globalThis.clearTimeout = () => {};
  try {
    const fs = new FileSystem();
    events.length = 0;
    await callbacks.create(uri('file:///late.avt'));
    assert.equal(scheduled.length, 1);
    fs.stop();
    scheduled[0]();
    await new Promise(resolve => queueMicrotask(resolve));
    assert.deepEqual(events, []);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
});

test('file event burst coalesces separate paths and ignores unrelated files', async () => {
  const fs = new FileSystem();
  events.length = 0;
  await callbacks.create(uri('file:///a.avt'));
  await callbacks.change(uri('file:///a.avt'));
  await callbacks.create(uri('file:///b.avt'));
  await callbacks.delete(uri('file:///b.avt'));
  await callbacks.change(uri('file:///c.avt'));
  await callbacks.create(uri('file:///notes.txt'));
  await fs.sendStack();
  assert.deepEqual(events, [['FileBatch', {
    created: ['file:///a.avt'],
    updated: ['file:///c.avt'],
    deleted: ['file:///b.avt'],
  }]]);
  fs.stop();
});
