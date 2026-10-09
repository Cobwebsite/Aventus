import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { FilesWatcher }, { GenericServer }, { SettingsManager }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'files/FilesWatcher.ts', 'GenericServer.ts', 'settings/Settings.ts', 'tools.ts',
]);

function freshManager() {
    const current = Object.create(FilesManager.prototype);
    Object.assign(current, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    return current;
}

async function until(check) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (check()) return;
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.fail('file event did not finish');
}

test('client edit suppresses its own disk echo while a second watched file updates independently', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-echo-'));
    const aPath = join(root, 'a.wcl.avt');
    const bPath = join(root, 'b.wcl.avt');
    const aUri = pathToUri(aPath);
    const bUri = pathToUri(bPath);
    const prior = [FilesManager.instance, FilesWatcher.instance, GenericServer.instance, SettingsManager.instance];
    const manager = freshManager();
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [];
    watcher.watcher = { add() {} };
    const events = [];
    FilesManager.instance = manager;
    FilesWatcher.instance = watcher;
    GenericServer.instance = { isIDE: false, logLevel: 99, connection: { sendDiagnostics() {} } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    manager.onNewFile(async file => {
        file.onContentChange(async current => events.push(['change', current.uri, current.versionUser, current.contentUser]));
        file.onSave(async current => events.push(['save', current.uri, current.contentUser]));
    });
    try {
        writeFileSync(aPath, 'a disk 0');
        writeFileSync(bPath, 'b disk 0');
        await manager.registerFile(TextDocument.create(aUri, 'typescript', 1, 'a client 1'));
        await manager.registerFile(TextDocument.create(bUri, 'typescript', 1, 'b client 1'));
        assert.deepEqual(watcher.watcheUris, [aUri, bUri]);

        manager.preventUpdateUri(aUri);
        await manager.onContentChange(TextDocument.create(aUri, 'typescript', 2, 'a client 2'));
        writeFileSync(aPath, 'a disk echo');
        writeFileSync(bPath, 'b disk 2');
        await watcher.onContentChange(aPath);
        await watcher.onContentChange(bPath);
        await until(() => events.some(event => event[0] === 'save' && event[1] === bUri));
        assert.equal(manager.getByUri(aUri).contentUser, 'a client 2');
        assert.equal(manager.getByUri(aUri).versionUser, 2);
        assert.equal(manager.getByUri(bUri).versionUser, 2);
        assert.deepEqual(events, [
            ['change', aUri, 2, 'a client 2'],
            ['change', bUri, 2, 'b disk 2'],
            ['save', bUri, 'b disk 2'],
        ]);
    } finally {
        for (const timeout of Object.values(manager.lockedUpdatedUri)) clearTimeout(timeout);
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        [FilesManager.instance, FilesWatcher.instance, GenericServer.instance, SettingsManager.instance] = prior;
        rmSync(root, { recursive: true, force: true });
    }
});

test('closing a present file retains its cache, whereas disk removal unwatches and recreation registers a new file', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-close-recreate-'));
    const retainedPath = join(root, 'retained.wcl.avt');
    const recycledPath = join(root, 'recycled.wcl.avt');
    const retainedUri = pathToUri(retainedPath);
    const recycledUri = pathToUri(recycledPath);
    const prior = [FilesManager.instance, FilesWatcher.instance, GenericServer.instance, SettingsManager.instance];
    const manager = freshManager();
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [];
    watcher.watcher = { add() {} };
    const events = [];
    FilesManager.instance = manager;
    FilesWatcher.instance = watcher;
    GenericServer.instance = { isIDE: false, logLevel: 99, connection: { sendDiagnostics: params => events.push(['diagnostics', params.uri]) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    manager.onNewFile(async file => {
        events.push(['new', file.uri]);
        file.onDelete(async deleted => events.push(['delete', deleted.uri]));
    });
    try {
        writeFileSync(retainedPath, 'retained');
        writeFileSync(recycledPath, 'old');
        await manager.registerFile(TextDocument.create(retainedUri, 'typescript', 1, 'retained'));
        await manager.registerFile(TextDocument.create(recycledUri, 'typescript', 1, 'old'));
        const retained = manager.getByUri(retainedUri);
        const recycled = manager.getByUri(recycledUri);
        await manager.onClose(TextDocument.create(retainedUri, 'typescript', 1, 'retained'));
        assert.equal(manager.getByUri(retainedUri), retained);
        assert.ok(watcher.watcheUris.includes(retainedUri));

        unlinkSync(recycledPath);
        await watcher.onRemove(recycledPath);
        await until(() => manager.getByUri(recycledUri) === undefined);
        assert.deepEqual(watcher.watcheUris, [retainedUri]);
        writeFileSync(recycledPath, 'new');
        await manager.onCreatedUri(recycledUri);
        assert.notEqual(manager.getByUri(recycledUri), recycled);
        assert.equal(manager.getByUri(recycledUri).contentUser, 'new');
        assert.equal(existsSync(recycledPath), true);
        assert.deepEqual(watcher.watcheUris, [retainedUri, recycledUri]);
        assert.deepEqual(events, [
            ['new', retainedUri], ['new', recycledUri],
            ['diagnostics', recycledUri], ['delete', recycledUri],
            ['new', recycledUri],
        ]);
    } finally {
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        [FilesManager.instance, FilesWatcher.instance, GenericServer.instance, SettingsManager.instance] = prior;
        rmSync(root, { recursive: true, force: true });
    }
});
