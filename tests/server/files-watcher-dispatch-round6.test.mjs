import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesWatcher }, { FilesManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'files/FilesWatcher.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts',
]);

test('watcher forwards disk changes and removals only for registered URIs', async () => {
    const oldManager = FilesManager.instance;
    const oldServer = GenericServer.instance;
    const calls = [];
    const path = 'D:/project/source.wcl.avt';
    const uri = pathToUri(path);
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [uri];
    FilesManager.instance = {
        onUpdatedUri: current => calls.push(['update', current]),
        onDeletedUri: current => calls.push(['delete', current]),
    };
    GenericServer.instance = { logLevel: 99 };
    try {
        await watcher.onContentChange('D:/project/other.wcl.avt');
        await watcher.onRemove('D:/project/other.wcl.avt');
        assert.deepEqual(calls, []);
        await watcher.onContentChange(path);
        await watcher.onRemove(path);
        assert.deepEqual(calls, [['update', uri], ['delete', uri]]);
        watcher.unwatch(uri);
        await watcher.onContentChange(path);
        await watcher.onRemove(path);
        assert.equal(calls.length, 2);
    } finally {
        FilesManager.instance = oldManager;
        GenericServer.instance = oldServer;
    }
});

test('watch without an active filesystem watcher does not record the URI', () => {
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [];
    watcher.watch('file:///d%3A/project/source.wcl.avt');
    assert.deepEqual(watcher.watcheUris, []);
});

test('watcher callbacks wait for file processing and preserve event order per URI', async () => {
    const oldManager = FilesManager.instance;
    const oldServer = GenericServer.instance;
    const path = 'D:/project/source.wcl.avt';
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [pathToUri(path)];
    const calls = [];
    let releaseUpdate;
    let releaseDelete;
    const updateGate = new Promise(resolve => { releaseUpdate = resolve; });
    const deleteGate = new Promise(resolve => { releaseDelete = resolve; });
    FilesManager.instance = {
        onUpdatedUri: async () => { calls.push('update start'); await updateGate; calls.push('update end'); },
        onDeletedUri: async () => { calls.push('delete start'); await deleteGate; calls.push('delete end'); },
    };
    GenericServer.instance = { logLevel: 99 };
    try {
        const update = watcher.onContentChange(path);
        let updateDone = false;
        void update.then(() => { updateDone = true; });
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(calls, ['update start']);
        const remove = watcher.onRemove(path);
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(calls, ['update start']);
        assert.equal(updateDone, false);
        releaseUpdate();
        await update;
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(calls, ['update start', 'update end', 'delete start']);
        releaseDelete();
        await remove;
        assert.deepEqual(calls, ['update start', 'update end', 'delete start', 'delete end']);
    } finally {
        releaseUpdate();
        releaseDelete();
        FilesManager.instance = oldManager;
        GenericServer.instance = oldServer;
    }
});

test('watcher propagates processing errors and continues with the next event', async () => {
    const oldManager = FilesManager.instance;
    const oldServer = GenericServer.instance;
    const path = 'D:/project/source.wcl.avt';
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [pathToUri(path)];
    const calls = [];
    FilesManager.instance = {
        onUpdatedUri: async () => { calls.push('update'); throw new Error('update failed'); },
        onDeletedUri: async () => { calls.push('delete'); },
    };
    GenericServer.instance = { logLevel: 99 };
    try {
        const update = watcher.onContentChange(path);
        const remove = watcher.onRemove(path);
        await assert.rejects(update, /update failed/);
        await remove;
        assert.deepEqual(calls, ['update', 'delete']);
    } finally {
        FilesManager.instance = oldManager;
        GenericServer.instance = oldServer;
    }
});
