import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ FilesManager }, { FilesWatcher }, { GenericServer }, { SettingsManager }, { pathToUri, uriToPath }] = await loadServerModules([
    'files/FilesManager.ts', 'files/FilesWatcher.ts', 'GenericServer.ts', 'settings/Settings.ts', 'tools.ts',
]);

test('disk rename and recreation keep encoded URI and path cache entries distinct', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-encoded-rename-'));
    const folder = join(root, 'équipe avec espaces');
    const oldPath = join(folder, 'avant @test.wcl.avt');
    const newPath = join(folder, 'après @test.wcl.avt');
    const oldUri = pathToUri(oldPath);
    const newUri = pathToUri(newPath);
    const previous = [GenericServer.instance, FilesWatcher.instance, SettingsManager.instance];
    const events = [];
    const manager = Object.create(FilesManager.prototype);
    manager.pendingRegistrations = new Map();
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    GenericServer.instance = { isIDE: false, logLevel: 99, connection: { sendDiagnostics: value => events.push(['diagnostics', value.uri]) } };
    FilesWatcher.instance = { watch: uri => events.push(['watch', uri]), unwatch: uri => events.push(['unwatch', uri]) };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    try {
        mkdirSync(folder);
        writeFileSync(oldPath, 'class Before {}');
        await manager.onCreatedUri(oldUri);
        const first = manager.getByPath(oldPath);
        assert.ok(first);
        assert.equal(pathToUri(uriToPath(oldUri)), oldUri);
        assert.equal(first.uri, oldUri);

        renameSync(oldPath, newPath);
        await manager.onDeletedUri(oldUri);
        await manager.onCreatedUri(newUri);
        assert.equal(manager.getByUri(oldUri), undefined);
        assert.equal(manager.getByPath(oldPath), undefined);
        assert.equal(manager.getByPath(newPath), manager.getByUri(newUri));
        assert.notEqual(manager.getByPath(newPath), first);
        assert.equal(manager.getByUri(newUri).contentUser, 'class Before {}');

        writeFileSync(oldPath, 'class Restored {}');
        await manager.onCreatedUri(oldUri);
        assert.equal(manager.getByUri(oldUri).contentUser, 'class Restored {}');
        assert.equal(manager.getByUri(newUri).contentUser, 'class Before {}');
        assert.deepEqual(new Set(manager.getUris()), new Set([oldUri, newUri]));
        assert.deepEqual(events.filter(([kind]) => kind === 'unwatch'), [['unwatch', oldUri]]);
    } finally {
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        [GenericServer.instance, FilesWatcher.instance, SettingsManager.instance] = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
