import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ FilesWatcher }, { FilesManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'files/FilesWatcher.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts',
]);

test('destroy settles after a rejected active event and discards its queued deletion', async () => {
    const path = 'D:/project/shutdown-failure.wcl.avt';
    const uri = pathToUri(path);
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [uri];
    watcher.pendingEvents = new Map();
    watcher.watchGeneration = new Map();
    watcher.destroyed = false;
    const calls = [];
    watcher.watcher = { close: async () => { calls.push('close'); } };
    const previousWatcher = FilesWatcher.instance;
    const previousManager = FilesManager.instance;
    const previousServer = GenericServer.instance;
    let rejectUpdate;
    const updateGate = new Promise((_, reject) => { rejectUpdate = reject; });
    FilesWatcher.instance = watcher;
    FilesManager.instance = {
        onUpdatedUri: async () => { calls.push('update start'); await updateGate; },
        onDeletedUri: async () => { calls.push('delete'); },
    };
    GenericServer.instance = { logLevel: 99 };
    try {
        const update = watcher.onContentChange(path);
        const removal = watcher.onRemove(path);
        const rejectedUpdate = assert.rejects(update, /read failed/);
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(calls, ['update start']);

        let settled = false;
        const destruction = watcher.destroy().then(() => { settled = true; });
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(settled, false);
        assert.deepEqual(calls, ['update start', 'close']);

        rejectUpdate(new Error('read failed'));
        await Promise.all([rejectedUpdate, removal, destruction]);
        assert.deepEqual(calls, ['update start', 'close']);
        assert.equal(watcher.pendingEvents.size, 0);
        assert.equal(FilesWatcher.instance, undefined);
    } finally {
        rejectUpdate(new Error('cleanup'));
        FilesWatcher.instance = previousWatcher;
        FilesManager.instance = previousManager;
        GenericServer.instance = previousServer;
    }
});
