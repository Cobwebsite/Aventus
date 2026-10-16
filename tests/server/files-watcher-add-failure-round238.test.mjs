import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesWatcher }, { pathToUri, uriToPath }] = await loadServerModules([
    'files/FilesWatcher.ts', 'tools.ts',
]);

test('failed watcher subscription permits retry without explicit unwatch', () => {
    const path = 'D:/project/retry.wcl.avt';
    const uri = pathToUri(path);
    const watchedPath = uriToPath(uri);
    const calls = [];
    let fail = true;
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [];
    watcher.pendingEvents = new Map();
    watcher.watchGeneration = new Map();
    watcher.watcher = {
        add(value) {
            calls.push(['add', value]);
            if (fail) throw new Error('watch subscription failed');
        },
        unwatch(value) { calls.push(['unwatch', value]); },
    };

    assert.throws(() => watcher.watch(uri), /watch subscription failed/);
    assert.deepEqual(watcher.watcheUris, []);
    fail = false;
    watcher.watch(uri);
    assert.deepEqual(calls, [['add', watchedPath], ['add', watchedPath]]);
    assert.deepEqual(watcher.watcheUris, [uri]);
    watcher.watch(uri);
    assert.deepEqual(calls, [['add', watchedPath], ['add', watchedPath]]);
});
