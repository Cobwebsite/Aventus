import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ FilesWatcher }, { FilesManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'files/FilesWatcher.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts',
]);

test('destroy waits for active callbacks on separate files even when one fails', async () => {
    const firstPath = 'D:/project/first.wcl.avt';
    const secondPath = 'D:/project/second.wcl.avt';
    const firstUri = pathToUri(firstPath);
    const secondUri = pathToUri(secondPath);
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [firstUri, secondUri];
    watcher.pendingEvents = new Map();
    watcher.watchGeneration = new Map();
    watcher.destroyed = false;
    const previousWatcher = FilesWatcher.instance;
    const previousManager = FilesManager.instance;
    const previousServer = GenericServer.instance;
    const calls = [];
    let failFirst;
    let releaseSecond;
    const firstGate = new Promise((_, reject) => { failFirst = reject; });
    const secondGate = new Promise(resolve => { releaseSecond = resolve; });
    watcher.watcher = { close: async () => { calls.push('close'); } };
    FilesWatcher.instance = watcher;
    FilesManager.instance = {
        onUpdatedUri: async uri => {
            calls.push(['start', uri]);
            if (uri === firstUri) await firstGate;
            else await secondGate;
            calls.push(['end', uri]);
        },
        onDeletedUri: async uri => { calls.push(['delete', uri]); },
    };
    GenericServer.instance = { logLevel: 99 };
    try {
        const first = watcher.onContentChange(firstPath);
        const firstRejected = assert.rejects(first, /first callback failed/);
        const second = watcher.onContentChange(secondPath);
        const queuedFirst = watcher.onRemove(firstPath);
        const queuedSecond = watcher.onRemove(secondPath);
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(calls, [['start', firstUri], ['start', secondUri]]);

        let destroyed = false;
        const destruction = watcher.destroy().then(() => { destroyed = true; });
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(destroyed, false);
        assert.equal(watcher.destroyed, true);

        failFirst(Error('first callback failed'));
        await firstRejected;
        await queuedFirst;
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(destroyed, false);
        assert.equal(FilesWatcher.instance, watcher);

        releaseSecond();
        await Promise.all([second, queuedSecond, destruction]);
        assert.deepEqual(calls, [
            ['start', firstUri], ['start', secondUri], 'close', ['end', secondUri],
        ]);
        assert.equal(watcher.pendingEvents.size, 0);
        assert.equal(FilesWatcher.instance, undefined);
    } finally {
        failFirst(Error('cleanup'));
        releaseSecond();
        FilesWatcher.instance = previousWatcher;
        FilesManager.instance = previousManager;
        GenericServer.instance = previousServer;
    }
});
