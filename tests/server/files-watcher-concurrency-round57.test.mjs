import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesWatcher }, { FilesManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'files/FilesWatcher.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts',
]);

function watcherFor(paths) {
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = paths.map(pathToUri);
    watcher.pendingEvents = new Map();
    return watcher;
}

test('filesystem processing is ordered per URI without blocking another URI', async () => {
    const slowPath = 'D:/project/slow.wcl.avt';
    const fastPath = 'D:/project/fast.wcl.avt';
    const slowUri = pathToUri(slowPath);
    const fastUri = pathToUri(fastPath);
    const watcher = watcherFor([slowPath, fastPath]);
    const previousManager = FilesManager.instance;
    const previousServer = GenericServer.instance;
    const events = [];
    let releaseSlow;
    const slowGate = new Promise(resolve => { releaseSlow = resolve; });
    FilesManager.instance = {
        onUpdatedUri: async uri => {
            events.push(['update-start', uri]);
            if (uri === slowUri) await slowGate;
            events.push(['update-end', uri]);
        },
        onDeletedUri: async uri => { events.push(['delete', uri]); },
    };
    GenericServer.instance = { logLevel: 99 };
    try {
        const slowUpdate = watcher.onContentChange(slowPath);
        const slowDelete = watcher.onRemove(slowPath);
        const fastUpdate = watcher.onContentChange(fastPath);
        const fastDelete = watcher.onRemove(fastPath);
        await Promise.all([fastUpdate, fastDelete]);
        assert.deepEqual(events, [
            ['update-start', slowUri],
            ['update-start', fastUri],
            ['update-end', fastUri],
            ['delete', fastUri],
        ]);
        assert.equal(watcher.pendingEvents.has(fastUri), false);
        assert.equal(watcher.pendingEvents.has(slowUri), true);
        releaseSlow();
        await Promise.all([slowUpdate, slowDelete]);
        assert.deepEqual(events.slice(4), [['update-end', slowUri], ['delete', slowUri]]);
        assert.equal(watcher.pendingEvents.size, 0);
    } finally {
        releaseSlow();
        FilesManager.instance = previousManager;
        GenericServer.instance = previousServer;
    }
});

test('a failed event clears its URI queue and does not affect another file', async () => {
    const failedPath = 'D:/project/failed.wcl.avt';
    const otherPath = 'D:/project/other.wcl.avt';
    const failedUri = pathToUri(failedPath);
    const otherUri = pathToUri(otherPath);
    const watcher = watcherFor([failedPath, otherPath]);
    const previousManager = FilesManager.instance;
    const previousServer = GenericServer.instance;
    const events = [];
    FilesManager.instance = {
        onUpdatedUri: async uri => {
            events.push(['update', uri]);
            if (uri === failedUri) throw new Error('failed update');
        },
        onDeletedUri: async uri => { events.push(['delete', uri]); },
    };
    GenericServer.instance = { logLevel: 99 };
    try {
        const failure = watcher.onContentChange(failedPath);
        const other = watcher.onContentChange(otherPath);
        await assert.rejects(failure, /failed update/);
        await other;
        assert.equal(watcher.pendingEvents.size, 0);
        await watcher.onRemove(failedPath);
        assert.deepEqual(events, [
            ['update', failedUri], ['update', otherUri], ['delete', failedUri],
        ]);
        assert.equal(watcher.pendingEvents.size, 0);
    } finally {
        FilesManager.instance = previousManager;
        GenericServer.instance = previousServer;
    }
});
