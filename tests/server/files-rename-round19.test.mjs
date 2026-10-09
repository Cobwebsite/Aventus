import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { FilesWatcher }, { GenericServer }, { SettingsManager }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'files/FilesWatcher.ts', 'GenericServer.ts', 'settings/Settings.ts', 'tools.ts',
]);

function createManager() {
    const instance = Object.create(FilesManager.prototype);
    Object.assign(instance, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    return instance;
}

test('disk rename removes the old URI and registers the new URI with its disk content', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-rename-round19-'));
    const oldPath = join(root, 'before.wcl.avt');
    const newPath = join(root, 'after.wcl.avt');
    const oldUri = pathToUri(oldPath);
    const newUri = pathToUri(newPath);
    const manager = createManager();
    const previousServer = GenericServer.instance;
    const previousWatcher = FilesWatcher.instance;
    const previousSettings = SettingsManager.instance;
    const events = [];
    GenericServer.instance = { isIDE: false, logLevel: 99, connection: { sendDiagnostics: value => events.push(['diagnostics', value.uri]) } };
    FilesWatcher.instance = { watch: uri => events.push(['watch', uri]), unwatch: uri => events.push(['unwatch', uri]) };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    manager.onNewFile(async file => events.push(['new', file.uri]));
    try {
        writeFileSync(oldPath, 'class Before {}');
        await manager.onCreatedUri(oldUri);
        const oldFile = manager.getByUri(oldUri);
        writeFileSync(newPath, 'class Before {}');
        unlinkSync(oldPath);
        await manager.onDeletedUri(oldUri);
        await manager.onCreatedUri(newUri);
        assert.equal(manager.getByUri(oldUri), undefined);
        assert.equal(manager.getByPath(oldPath), undefined);
        assert.equal(manager.getByUri(newUri).contentUser, 'class Before {}');
        assert.equal(manager.getByPath(newPath), manager.getByUri(newUri));
        assert.notEqual(manager.getByUri(newUri), oldFile);
        assert.deepEqual(manager.getUris(), [newUri]);
        assert.deepEqual(events.filter(event => ['new', 'unwatch'].includes(event[0])), [
            ['new', oldUri], ['unwatch', oldUri], ['new', newUri],
        ]);
    } finally {
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        clearTimeout(manager.lockedUpdatedUri[oldUri]);
        GenericServer.instance = previousServer;
        FilesWatcher.instance = previousWatcher;
        SettingsManager.instance = previousSettings;
        rmSync(root, { recursive: true, force: true });
    }
});

test('watching the same URI twice subscribes once and can subscribe again after unwatch', () => {
    const watcher = Object.create(FilesWatcher.prototype);
    const added = [];
    watcher.watcheUris = [];
    watcher.watcher = { add: path => added.push(path) };
    const path = 'D:/project/entry.wcl.avt';
    const uri = pathToUri(path);
    watcher.watch(uri);
    watcher.watch(uri);
    assert.deepEqual(watcher.watcheUris, [uri]);
    assert.equal(added.length, 1);
    watcher.unwatch(uri);
    watcher.unwatch(uri);
    assert.deepEqual(watcher.watcheUris, []);
    watcher.watch(uri);
    assert.deepEqual(watcher.watcheUris, [uri]);
    assert.equal(added.length, 2);
});
