import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { GenericServer }, { SettingsManager }, { FilesWatcher }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'GenericServer.ts', 'settings/Settings.ts', 'files/FilesWatcher.ts', 'tools.ts',
]);

function manager() {
    const instance = Object.create(FilesManager.prototype);
    Object.assign(instance, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    return instance;
}

test('content and save notifications for a new in-memory file create one cached file', async () => {
    const current = manager();
    const oldServer = GenericServer.instance;
    const events = [];
    const uri = 'file:///round17-unsaved.wcl.avt';
    GenericServer.instance = { logLevel: 99, isIDE: true };
    current.onNewFile(async file => {
        events.push(['create', file.contentUser]);
        file.onContentChange(async changed => events.push(['change', changed.contentUser]));
        file.onSave(async saved => events.push(['save', saved.contentUser]));
    });
    try {
        await current.onContentChange(TextDocument.create(uri, 'typescript', 1, 'first'));
        const file = current.getByUri(uri);
        await current.onContentChange(TextDocument.create(uri, 'typescript', 2, 'second'));
        await current.onSave(TextDocument.create(uri, 'typescript', 2, 'second'));
        assert.equal(current.getByUri(uri), file);
        assert.equal(file.versionUser, 2);
        assert.deepEqual(events, [['create', 'first'], ['change', 'second'], ['save', 'second']]);
    } finally {
        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = oldServer;
    }
});

test('closing an existing disk document preserves the in-memory file and sends no diagnostic clear', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-round17-close-'));
    const path = join(root, 'entry.wcl.avt');
    const uri = pathToUri(path);
    const current = manager();
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    const oldWatcher = FilesWatcher.instance;
    const cleared = [];
    const unwatched = [];
    let deleted = 0;
    GenericServer.instance = { logLevel: 99, connection: { sendDiagnostics: value => cleared.push(value) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    FilesWatcher.instance = { unwatch: value => unwatched.push(value) };
    current.files[uri] = { triggerDelete: async () => { deleted++; } };
    try {
        writeFileSync(path, 'on disk');
        await current.onClose(TextDocument.create(uri, 'typescript', 3, 'unsaved buffer'));
        assert.ok(current.getByUri(uri));
        assert.equal(deleted, 0);
        assert.deepEqual(cleared, []);
        assert.deepEqual(unwatched, []);
    } finally {
        GenericServer.instance = oldServer;
        SettingsManager.instance = oldSettings;
        FilesWatcher.instance = oldWatcher;
        rmSync(root, { recursive: true, force: true });
    }
});

test('configuration notification waits for workspace loading while source notification is registered', async () => {
    const current = manager();
    const oldServer = GenericServer.instance;
    const seen = [];
    GenericServer.instance = { logLevel: 99, isIDE: true };
    current.loadingInProgress = true;
    current.onNewFile(async file => seen.push(file.uri));
    const config = TextDocument.create('file:///round17/aventus.conf.avt', 'json', 1, '{}');
    const source = TextDocument.create('file:///round17/entry.wcl.avt', 'typescript', 1, 'class Entry {}');
    try {
        await current.onContentChange(config);
        await current.onContentChange(source);
        assert.deepEqual(seen, [source.uri]);
        assert.equal(current.getByUri(config.uri), undefined);
        assert.ok(current.getByUri(source.uri));
        current.loadingInProgress = false;
        await current.onContentChange(config);
        assert.deepEqual(seen, [source.uri, config.uri]);
        assert.ok(current.getByUri(config.uri));
    } finally {
        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = oldServer;
    }
});
