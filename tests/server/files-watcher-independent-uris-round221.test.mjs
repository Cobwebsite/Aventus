import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesWatcher }, { FilesManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'files/FilesWatcher.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts',
]);

test('watcher serializes each URI while a second URI continues independently', async () => {
    const firstPath = 'D:/project/first.wcl.avt';
    const secondPath = 'D:/project/second.wcl.avt';
    const firstUri = pathToUri(firstPath);
    const secondUri = pathToUri(secondPath);
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [firstUri, secondUri];
    watcher.pendingEvents = new Map();
    const previousManager = FilesManager.instance;
    const previousServer = GenericServer.instance;
    const calls = [];
    let releaseFirst;
    const firstGate = new Promise(resolve => { releaseFirst = resolve; });
    FilesManager.instance = {
        onUpdatedUri: async uri => {
            calls.push(['update start', uri]);
            if (uri === firstUri) await firstGate;
            calls.push(['update end', uri]);
        },
        onDeletedUri: async uri => { calls.push(['delete', uri]); },
    };
    GenericServer.instance = { logLevel: 99 };
    try {
        const firstUpdate = watcher.onContentChange(firstPath);
        const firstDelete = watcher.onRemove(firstPath);
        const secondUpdate = watcher.onContentChange(secondPath);
        const secondDelete = watcher.onRemove(secondPath);

        await Promise.all([secondUpdate, secondDelete]);
        assert.deepEqual(calls, [
            ['update start', firstUri],
            ['update start', secondUri],
            ['update end', secondUri],
            ['delete', secondUri],
        ]);
        assert.equal(watcher.pendingEvents.has(firstUri), true);
        assert.equal(watcher.pendingEvents.has(secondUri), false);

        releaseFirst();
        await Promise.all([firstUpdate, firstDelete]);
        assert.deepEqual(calls.slice(4), [['update end', firstUri], ['delete', firstUri]]);
        assert.equal(watcher.pendingEvents.size, 0);
    } finally {
        releaseFirst();
        FilesManager.instance = previousManager;
        GenericServer.instance = previousServer;
    }
});
