import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ FilesManager }, { GenericServer }, { SettingsManager }, { FilesWatcher }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'GenericServer.ts', 'settings/Settings.ts', 'files/FilesWatcher.ts', 'tools.ts',
]);

const diagnostic = (message, character = 0) => ({ message, range: {
    start: { line: 0, character }, end: { line: 0, character: character + 1 },
} });

test('diagnostics are replaced by an empty publication after revalidation, then deletion clears once', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-diagnostic-publication-'));
    const path = join(root, 'entry.wcl.avt');
    const uri = pathToUri(path);
    const manager = Object.create(FilesManager.prototype);
    manager.pendingRegistrations = new Map();
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    const previous = [GenericServer.instance, SettingsManager.instance, FilesWatcher.instance];
    const publications = [];
    const unwatched = [];
    GenericServer.instance = { logLevel: 99, isIDE: true, connection: { sendDiagnostics: params => publications.push(params) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    FilesWatcher.instance = { unwatch: current => unwatched.push(current) };
    const doc = (version, content) => TextDocument.create(uri, 'typescript', version, content);
    try {
        writeFileSync(path, 'on disk');
        await manager.registerFile(doc(1, 'invalid'));
        const file = manager.getByUri(uri);
        file.onValidate(async current => current.contentUser === 'invalid'
            ? [diagnostic('invalid', 0), diagnostic('invalid', 0), diagnostic('other', 1)] : []);
        assert.deepEqual(await file.validate(), [diagnostic('invalid', 0), diagnostic('other', 1)]);
        await manager.onContentChange(doc(2, 'valid'));
        assert.deepEqual(await file.validate(), []);
        assert.deepEqual(publications, [
            { uri, diagnostics: [diagnostic('invalid', 0), diagnostic('other', 1)] },
            { uri, diagnostics: [] },
        ]);
        await manager.onClose(doc(2, 'valid'));
        assert.equal(manager.getByUri(uri), file);
        assert.equal(publications.length, 2);
        unlinkSync(path);
        await manager.onDeletedUri(uri);
        await manager.onDeletedUri(uri);
        assert.deepEqual(publications[2], { uri, diagnostics: [] });
        assert.equal(publications.length, 3);
        assert.deepEqual(unwatched, [uri]);
    } finally {
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        [GenericServer.instance, SettingsManager.instance, FilesWatcher.instance] = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
