import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { FilesWatcher } = await loadServerModule('files/FilesWatcher.ts');

test('files watcher adds each URI only once and removes it from its registry', () => {
    const added = [];
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [];
    watcher.watcher = { add: path => added.push(path) };
    const uri = 'file:///d%3A/app/file.wcl.avt';
    watcher.watch(uri);
    watcher.watch(uri);
    assert.deepEqual(watcher.watcheUris, [uri]);
    assert.deepEqual(added, ['d:/app/file.wcl.avt']);
    watcher.unwatch(uri);
    assert.deepEqual(watcher.watcheUris, []);
    watcher.unwatch(uri);
});

test('files watcher closes an active watcher on destruction', async () => {
    const watcher = Object.create(FilesWatcher.prototype);
    let closed = false;
    watcher.watcher = { close: async () => { closed = true; } };
    await watcher.destroy();
    assert.equal(closed, true);
});
