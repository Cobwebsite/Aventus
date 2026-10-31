import assert from 'node:assert/strict';
import { mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ FilesManager }, { FilesWatcher }, { GenericServer }, { SettingsManager }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'files/FilesWatcher.ts', 'GenericServer.ts', 'settings/Settings.ts', 'tools.ts',
]);

function manager() {
    const current = Object.create(FilesManager.prototype);
    current.pendingRegistrations = new Map();
    Object.assign(current, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    return current;
}

test('client save on one path and disk rename on another keep file cache, callbacks, and diagnostics isolated', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-client-rename-'));
    const clientPath = join(root, 'client.wcl.avt');
    const oldPath = join(root, 'old.wcl.avt');
    const newPath = join(root, 'new.wcl.avt');
    const clientUri = pathToUri(clientPath);
    const oldUri = pathToUri(oldPath);
    const newUri = pathToUri(newPath);
    const previous = [FilesManager.instance, FilesWatcher.instance, GenericServer.instance, SettingsManager.instance];
    const current = manager();
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [];
    watcher.pendingEvents = new Map();
    watcher.watchGeneration = new Map();
    watcher.watcher = { add() {}, unwatch() {} };
    const events = [];
    const diagnostics = [];
    FilesManager.instance = current;
    FilesWatcher.instance = watcher;
    GenericServer.instance = { isIDE: false, logLevel: 99, connection: { sendDiagnostics: value => diagnostics.push(value) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    current.onNewFile(async file => {
        events.push(['new', file.uri]);
        file.onContentChange(async changed => events.push(['change', changed.uri, changed.versionUser, changed.contentUser]));
        file.onSave(async saved => events.push(['save', saved.uri, saved.versionUser]));
        file.onDelete(async deleted => events.push(['delete', deleted.uri]));
    });
    const doc = (uri, version, content) => TextDocument.create(uri, 'typescript', version, content);
    try {
        writeFileSync(clientPath, 'client disk');
        writeFileSync(oldPath, 'old disk');
        await current.registerFile(doc(clientUri, 1, 'client open'));
        await current.registerFile(doc(oldUri, 1, 'old open'));
        const clientFile = current.getByUri(clientUri);
        const oldFile = current.getByUri(oldUri);

        await current.onContentChange(doc(clientUri, 2, 'client saved'));
        await current.onSave(doc(clientUri, 2, 'client saved'));
        writeFileSync(clientPath, 'client saved');
        current.preventUpdateUri(clientUri);
        renameSync(oldPath, newPath);
        await watcher.onRemove(oldPath);
        await current.onCreatedUri(newUri);
        await watcher.onContentChange(clientPath);
        await current.onClose(doc(oldUri, 1, 'old open'));

        assert.equal(current.getByUri(clientUri), clientFile);
        assert.equal(clientFile.versionUser, 2);
        assert.equal(clientFile.contentUser, 'client saved');
        assert.equal(current.getByUri(oldUri), undefined);
        assert.notEqual(current.getByUri(newUri), oldFile);
        assert.equal(current.getByUri(newUri).contentUser, 'old disk');
        assert.deepEqual(watcher.watcheUris, [clientUri, newUri]);
        assert.deepEqual(diagnostics.filter(item => item.uri === oldUri), [{ uri: oldUri, diagnostics: [] }]);
        assert.equal(diagnostics.some(item => item.uri === clientUri), false);
        assert.deepEqual(events, [
            ['new', clientUri], ['new', oldUri],
            ['change', clientUri, 2, 'client saved'], ['save', clientUri, 2],
            ['delete', oldUri], ['new', newUri], ['save', newUri, 0],
        ]);
    } finally {
        for (const timeout of Object.values(current.lockedUpdatedUri)) clearTimeout(timeout);
        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        [FilesManager.instance, FilesWatcher.instance, GenericServer.instance, SettingsManager.instance] = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
