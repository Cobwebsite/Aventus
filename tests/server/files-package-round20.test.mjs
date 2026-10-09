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

test('external package registration loads disk content, caches file, and installs a watcher', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-package-registration-'));
    const path = join(root, 'library.package.avt');
    const uri = pathToUri(path);
    const previousServer = GenericServer.instance;
    const previousWatcher = FilesWatcher.instance;
    const watched = [];
    GenericServer.instance = { isIDE: true, logLevel: 99 };
    FilesWatcher.instance = { watch: value => watched.push(value) };
    const current = manager();
    try {
        writeFileSync(path, 'declare namespace Library {}');
        const file = await current.registerFilePackage(uri);
        assert.equal(file, current.getByUri(uri));
        assert.equal(file.contentUser, 'declare namespace Library {}');
        assert.deepEqual(current.getUris(), [uri]);
        assert.deepEqual(watched, [uri]);
    } finally {
        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        FilesWatcher.instance = previousWatcher;
        rmSync(root, { recursive: true, force: true });
    }
});

test('missing external package registers an empty cached document', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-package-missing-'));
    const uri = pathToUri(join(root, 'missing.package.avt'));
    const previousServer = GenericServer.instance;
    const previousWatcher = FilesWatcher.instance;
    const watched = [];
    GenericServer.instance = { isIDE: true, logLevel: 99 };
    FilesWatcher.instance = { watch: value => watched.push(value) };
    const current = manager();
    try {
        const file = await current.registerFilePackage(uri);
        assert.equal(file.contentUser, '');
        assert.equal(current.getByUri(uri), file);
        assert.deepEqual(watched, [uri]);
    } finally {
        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        FilesWatcher.instance = previousWatcher;
        rmSync(root, { recursive: true, force: true });
    }
});
