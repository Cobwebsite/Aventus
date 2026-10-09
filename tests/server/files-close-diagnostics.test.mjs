import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { GenericServer }, { SettingsManager }, { FilesWatcher }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'GenericServer.ts', 'settings/Settings.ts', 'files/FilesWatcher.ts', 'tools.ts',
]);

function manager() {
    const instance = Object.create(FilesManager.prototype);
    instance.files = {};
    instance.lockedUpdatedUri = {};
    instance.loadingInProgress = false;
    instance.onNewFileCb = {};
    instance.onFileRemoveCb = {};
    return instance;
}

test('closing a document keeps a still-present disk file, then clears its diagnostics after deletion', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-close-'));
    const path = join(root, 'component.wcl.avt');
    const uri = pathToUri(path);
    const document = TextDocument.create(uri, 'typescript', 1, 'fixture');
    const current = manager();
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    const previousWatcher = FilesWatcher.instance;
    const diagnostics = [];
    const unwatched = [];
    let deleted = 0;
    GenericServer.instance = { logLevel: 99, connection: { sendDiagnostics: params => diagnostics.push(params) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    FilesWatcher.instance = { unwatch: path => unwatched.push(path) };
    current.files[uri] = { triggerDelete: async () => { deleted++; } };
    try {
        writeFileSync(path, 'fixture');
        await current.onClose(document);
        assert.equal(existsSync(path), true);
        assert.ok(current.getByUri(uri));
        assert.equal(deleted, 0);
        unlinkSync(path);
        await current.onDeletedUri(uri);
        assert.equal(deleted, 1);
        assert.equal(current.getByUri(uri), undefined);
        assert.deepEqual(diagnostics, [{ uri, diagnostics: [] }]);
        assert.deepEqual(unwatched, [uri]);
    } finally {
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
        FilesWatcher.instance = previousWatcher;
        rmSync(root, { recursive: true, force: true });
    }
});

test('build-scoped deletion clears unscoped diagnostics when a file reports no build', async () => {
    const current = manager();
    const uri = 'file:///d%3A/unassigned.wcl.avt';
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    const previousWatcher = FilesWatcher.instance;
    const sent = [];
    GenericServer.instance = { logLevel: 99, connection: { sendDiagnostics: (params, build) => sent.push([params, build]) } };
    SettingsManager.instance = { settings: { errorByBuild: true } };
    FilesWatcher.instance = { unwatch() {} };
    current.files[uri] = { getBuild: () => null, triggerDelete: async () => {} };
    try {
        await current.onDeletedUri(uri);
        assert.deepEqual(sent, [[{ uri, diagnostics: [] }, undefined]]);
    } finally {
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
        FilesWatcher.instance = previousWatcher;
    }
});
