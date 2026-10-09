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

test('watcher callbacks currently resolve before asynchronous file processing finishes', async () => {
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
        await watcher.onContentChange(path);
        assert.deepEqual(calls, ['update start']);
        await watcher.onRemove(path);
        assert.deepEqual(calls, ['update start', 'delete start']);
        releaseUpdate();
        releaseDelete();
        await Promise.all([updateGate, deleteGate]);
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(calls, ['update start', 'delete start', 'update end', 'delete end']);
    } finally {
        releaseUpdate();
        releaseDelete();
        FilesManager.instance = oldManager;
        GenericServer.instance = oldServer;
    }
});
