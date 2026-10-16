import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesWatcher }, { FilesManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'files/FilesWatcher.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts',
]);

test('a deletion queued before unwatch is discarded after rewatch', async () => {
    const path = 'D:/project/recreated.wcl.avt';
    const uri = pathToUri(path);
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [uri];
    watcher.pendingEvents = new Map();
    watcher.watchGeneration = new Map();
    watcher.watcher = { add() {}, unwatch() {} };
    const previousManager = FilesManager.instance;
    const previousServer = GenericServer.instance;
    const calls = [];
    let releaseUpdate;
    const updateGate = new Promise(resolve => { releaseUpdate = resolve; });
    FilesManager.instance = {
        onUpdatedUri: async () => {
            calls.push('old update start');
            await updateGate;
            calls.push('old update end');
        },
        onDeletedUri: async () => { calls.push('old delete'); },
    };
    GenericServer.instance = { logLevel: 99 };
    try {
        const update = watcher.onContentChange(path);
        const removal = watcher.onRemove(path);
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(calls, ['old update start']);

        watcher.unwatch(uri);
        watcher.watch(uri);
        assert.deepEqual(watcher.watcheUris, [uri]);
        releaseUpdate();
        await Promise.all([update, removal]);

        assert.deepEqual(calls, ['old update start', 'old update end']);
        assert.equal(watcher.pendingEvents.size, 0);
    } finally {
        releaseUpdate();
        FilesManager.instance = previousManager;
        GenericServer.instance = previousServer;
    }
});

test('destroy waits for an active event and cancels a queued deletion', async () => {
    const path = 'D:/project/shutdown.wcl.avt';
    const uri = pathToUri(path);
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [uri];
    watcher.pendingEvents = new Map();
    watcher.watchGeneration = new Map();
    watcher.watcher = { close: async () => {} };
    const previousWatcher = FilesWatcher.instance;
    const previousManager = FilesManager.instance;
    const previousServer = GenericServer.instance;
    const calls = [];
    let releaseUpdate;
    const updateGate = new Promise(resolve => { releaseUpdate = resolve; });
    FilesWatcher.instance = watcher;
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
        const removal = watcher.onRemove(path);
        await new Promise(resolve => setImmediate(resolve));
        let destroyed = false;
        const destruction = watcher.destroy().then(() => { destroyed = true; });
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(destroyed, false);
        assert.deepEqual(calls, ['update start']);

        releaseUpdate();
        await Promise.all([update, removal, destruction]);
        assert.equal(FilesWatcher.instance, undefined);
        assert.deepEqual(calls, ['update start', 'update end']);
        assert.equal(watcher.pendingEvents.size, 0);
    } finally {
        releaseUpdate();
        FilesWatcher.instance = previousWatcher;
        FilesManager.instance = previousManager;
        GenericServer.instance = previousServer;
    }
});
