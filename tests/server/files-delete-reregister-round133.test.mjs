import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { FilesWatcher }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'files/FilesManager.ts', 'files/FilesWatcher.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

function createManager() {
    const manager = Object.create(FilesManager.prototype);
    manager.pendingRegistrations = new Map();
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    return manager;
}

test('a replacement registered while deletion is pending stays registered', async t => {
    const previous = [FilesWatcher.instance, GenericServer.instance, SettingsManager.instance, GenericServer.sendDiagnostics];
    const manager = createManager();
    const uri = 'file:///round133/recreated.wcl.avt';
    const doc = (version, content) => TextDocument.create(uri, 'typescript', version, content);
    const started = deferred();
    const release = deferred();
    const events = [];
    FilesWatcher.instance = { unwatch: value => events.push(['unwatch', value]) };
    GenericServer.instance = { isIDE: true, logLevel: 99 };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    GenericServer.sendDiagnostics = () => {};
    manager.onNewFile(async file => {
        events.push(['new', file.contentUser]);
        file.onDelete(async () => {
            started.resolve();
            await release.promise;
        });
    });
    t.after(() => {
        release.resolve();
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        [FilesWatcher.instance, GenericServer.instance, SettingsManager.instance, GenericServer.sendDiagnostics] = previous;
    });

    await manager.registerFile(doc(1, 'old'));
    const oldFile = manager.getByUri(uri);
    const deletion = manager.onDeletedUri(uri);
    await started.promise;
    assert.equal(oldFile.isDeleted, true);

    const replacement = await manager.registerFile(doc(2, 'replacement'));
    assert.notEqual(replacement, oldFile);
    assert.equal(manager.getByUri(uri), replacement);
    assert.equal(oldFile.contentUser, 'old');
    assert.deepEqual(events, [['new', 'old'], ['new', 'replacement']]);

    release.resolve();
    await deletion;
    assert.equal(manager.getByUri(uri), replacement);
    assert.deepEqual(events, [['new', 'old'], ['new', 'replacement']]);
    const retry = await manager.registerFile(doc(3, 'retry'));
    assert.equal(retry, replacement);
    assert.equal(retry.contentUser, 'retry');
    assert.deepEqual(events, [['new', 'old'], ['new', 'replacement']]);
});

test('a save is ignored while shutdown waits for its delete callback', async t => {
    const previous = [FilesWatcher.instance, GenericServer.instance];
    const manager = createManager();
    const uri = 'file:///round133/shutdown-save.wcl.avt';
    const doc = TextDocument.create(uri, 'typescript', 1, 'content');
    const started = deferred();
    const release = deferred();
    const events = [];
    FilesWatcher.instance = { unwatch: value => events.push(['unwatch', value]) };
    GenericServer.instance = { isIDE: true, logLevel: 99 };
    manager.onNewFile(async file => {
        file.onSave(async current => events.push(['save', current.isDeleted]));
        file.onDelete(async () => {
            events.push(['delete-start']);
            started.resolve();
            await release.promise;
            events.push(['delete-end']);
        });
    });
    t.after(() => {
        release.resolve();
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        [FilesWatcher.instance, GenericServer.instance] = previous;
    });

    await manager.registerFile(doc);
    const shutdown = manager.onShutdown();
    await started.promise;
    await manager.onSave(doc);
    assert.deepEqual(events, [['delete-start']]);
    release.resolve();
    await shutdown;
    assert.deepEqual(events, [['delete-start'], ['delete-end'], ['unwatch', uri]]);
    assert.equal(manager.getByUri(uri), undefined);
});
