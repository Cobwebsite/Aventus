import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesWatcher }, { FilesManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'files/FilesWatcher.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts',
]);

test('watcher close failure still waits for an active update and clears its singleton', async () => {
    const path = 'D:/project/close-failure.wcl.avt';
    const uri = pathToUri(path);
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [uri];
    watcher.pendingEvents = new Map();
    watcher.watchGeneration = new Map();
    watcher.destroyed = false;
    const previousWatcher = FilesWatcher.instance;
    const previousManager = FilesManager.instance;
    const previousServer = GenericServer.instance;
    const calls = [];
    let releaseUpdate;
    const updateGate = new Promise(resolve => { releaseUpdate = resolve; });
    watcher.watcher = { close: async () => { calls.push('close'); throw Error('close failed'); } };
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
        const deletion = watcher.onRemove(path);
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(calls, ['update start']);

        let settled = false;
        const destruction = watcher.destroy().then(
            () => { settled = true; },
            error => { settled = true; throw error; },
        );
        const rejected = assert.rejects(destruction, /close failed/);
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(settled, false);
        assert.deepEqual(calls, ['update start', 'close']);

        releaseUpdate();
        await Promise.all([update, deletion]);
        await rejected;
        assert.deepEqual(calls, ['update start', 'close', 'update end']);
        assert.equal(watcher.pendingEvents.size, 0);
        assert.equal(FilesWatcher.instance, undefined);
    } finally {
        releaseUpdate();
        FilesWatcher.instance = previousWatcher;
        FilesManager.instance = previousManager;
        GenericServer.instance = previousServer;
    }
});
