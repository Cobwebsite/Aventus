import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { GenericServer }, { FilesWatcher }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'GenericServer.ts', 'files/FilesWatcher.ts', 'tools.ts',
]);

function manager() {
    const instance = Object.create(FilesManager.prototype);
    Object.assign(instance, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    return instance;
}

test('disk creation registers a recognized document once and sends its save notification', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-created-round25-'));
    const path = join(root, 'created.wcl.avt');
    const uri = pathToUri(path);
    const previousServer = GenericServer.instance;
    const previousWatcher = FilesWatcher.instance;
    const events = [];
    const current = manager();
    GenericServer.instance = { isIDE: false, logLevel: 99 };
    FilesWatcher.instance = { watch: value => events.push(['watch', value]) };
    current.onNewFile(async file => {
        events.push(['new', file.contentUser]);
        file.onSave(async saved => events.push(['save', saved.contentUser]));
    });
    try {
        writeFileSync(path, 'class Created {}');
        await current.onCreatedUri(uri);
        await new Promise(resolve => setImmediate(resolve));
        const file = current.getByUri(uri);
        assert.ok(file);
        assert.equal(file.contentUser, 'class Created {}');
        assert.equal(file.versionUser, 0);
        assert.deepEqual(events, [['new', 'class Created {}'], ['watch', uri], ['save', 'class Created {}']]);
        await current.onCreatedUri(uri);
        assert.equal(current.getByUri(uri), file);
        assert.equal(events.length, 3);
    } finally {
        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        FilesWatcher.instance = previousWatcher;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    }
});

test('creation of an unrecognized extension leaves the cache and watcher untouched', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-created-round25-'));
    const path = join(root, 'notes.txt');
    const uri = pathToUri(path);
    const current = manager();
    const previousWatcher = FilesWatcher.instance;
    const watched = [];
    FilesWatcher.instance = { watch: value => watched.push(value) };
    try {
        writeFileSync(path, 'text');
        await current.onCreatedUri(uri);
        assert.deepEqual(current.getUris(), []);
        assert.deepEqual(watched, []);
    } finally {
        FilesWatcher.instance = previousWatcher;
        rmSync(root, { recursive: true, force: true });
    }
});
