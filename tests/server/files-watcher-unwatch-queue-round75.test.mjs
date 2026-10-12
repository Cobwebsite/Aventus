import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesWatcher }, { FilesManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'files/FilesWatcher.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts',
]);

test('an event already queued for an unwatched file still reaches the manager', async () => {
    const path = 'D:/project/removed.wcl.avt';
    const uri = pathToUri(path);
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [uri];
    watcher.pendingEvents = new Map();
    const oldManager = FilesManager.instance;
    const oldServer = GenericServer.instance;
    const calls = [];
    let releaseUpdate;
    const updateGate = new Promise(resolve => { releaseUpdate = resolve; });
    FilesManager.instance = {
        onUpdatedUri: async () => { calls.push('update start'); await updateGate; calls.push('update end'); },
        onDeletedUri: async () => { calls.push('delete'); },
    };
    GenericServer.instance = { logLevel: 99 };
    try {
        const update = watcher.onContentChange(path);
        const remove = watcher.onRemove(path);
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(calls, ['update start']);
        watcher.unwatch(uri);
        assert.deepEqual(watcher.watcheUris, []);
        releaseUpdate();
        await Promise.all([update, remove]);
        assert.deepEqual(calls, ['update start', 'update end', 'delete']);
        assert.equal(watcher.pendingEvents.size, 0);
        await watcher.onRemove(path);
        assert.deepEqual(calls, ['update start', 'update end', 'delete']);
    } finally {
        releaseUpdate();
        FilesManager.instance = oldManager;
        GenericServer.instance = oldServer;
    }
});
