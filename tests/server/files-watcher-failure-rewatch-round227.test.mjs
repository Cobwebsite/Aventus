import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesWatcher }, { FilesManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'files/FilesWatcher.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts',
]);

test('a failed update does not discard queued deletion and recreation across rewatch', async () => {
    const path = 'D:/project/recovered.wcl.avt';
    const uri = pathToUri(path);
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [uri];
    watcher.pendingEvents = new Map();
    watcher.watcher = { add() {}, unwatch() {} };
    const previousManager = FilesManager.instance;
    const previousServer = GenericServer.instance;
    const calls = [];
    let rejectFirst;
    const firstGate = new Promise((_, reject) => { rejectFirst = reject; });
    let updateCount = 0;
    FilesManager.instance = {
        onUpdatedUri: async currentUri => {
            calls.push(['update start', currentUri]);
            if (++updateCount === 1) await firstGate;
            calls.push(['update end', currentUri]);
        },
        onDeletedUri: async currentUri => { calls.push(['delete', currentUri]); },
    };
    GenericServer.instance = { logLevel: 99 };
    try {
        const failedUpdate = watcher.onContentChange(path);
        const deletion = watcher.onRemove(path);
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(calls, [['update start', uri]]);

        watcher.unwatch(uri);
        watcher.watch(uri);
        const recreation = watcher.onContentChange(path);
        rejectFirst(new Error('disk read failed'));
        await assert.rejects(failedUpdate, /disk read failed/);
        await Promise.all([deletion, recreation]);

        assert.deepEqual(calls, [
            ['update start', uri], ['delete', uri],
            ['update start', uri], ['update end', uri],
        ]);
        assert.equal(watcher.pendingEvents.size, 0);
        assert.deepEqual(watcher.watcheUris, [uri]);
    } finally {
        rejectFirst(new Error('cleanup'));
        FilesManager.instance = previousManager;
        GenericServer.instance = previousServer;
    }
});
