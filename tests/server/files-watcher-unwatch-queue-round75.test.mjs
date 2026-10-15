import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesWatcher }, { FilesManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'files/FilesWatcher.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts',
]);

test('unwatch cancels queued events for a file', async () => {
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
        assert.deepEqual(calls, ['update start', 'update end']);
        assert.equal(watcher.pendingEvents.size, 0);
        await watcher.onRemove(path);
        assert.deepEqual(calls, ['update start', 'update end']);
    } finally {
        releaseUpdate();
        FilesManager.instance = oldManager;
        GenericServer.instance = oldServer;
    }
});

test('rewatching the same URI does not revive an event from the previous watch', async () => {
    const path = 'D:/project/rewatched.wcl.avt';
    const uri = pathToUri(path);
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [uri];
    watcher.pendingEvents = new Map();
    watcher.watcher = { add() {}, unwatch() {} };
    const oldManager = FilesManager.instance;
    const oldServer = GenericServer.instance;
    const calls = [];
    let releaseUpdate;
    const updateGate = new Promise(resolve => { releaseUpdate = resolve; });
    FilesManager.instance = {
        onUpdatedUri: async () => {
            calls.push('update start');
            await updateGate;
            calls.push('update end');
        },
        onDeletedUri: async () => { calls.push('delete'); },
    };
    GenericServer.instance = { logLevel: 99 };
    try {
        const update = watcher.onContentChange(path);
        const oldRemove = watcher.onRemove(path);
        await new Promise(resolve => setImmediate(resolve));
        watcher.unwatch(uri);
        watcher.watch(uri);
        const newRemove = watcher.onRemove(path);
        releaseUpdate();
        await Promise.all([update, oldRemove, newRemove]);
        assert.deepEqual(calls, ['update start', 'update end', 'delete']);
        assert.equal(watcher.pendingEvents.size, 0);
    } finally {
        releaseUpdate();
        FilesManager.instance = oldManager;
        GenericServer.instance = oldServer;
    }
});
