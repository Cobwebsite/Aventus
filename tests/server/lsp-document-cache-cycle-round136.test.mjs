import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ VsCodeConnection }, { FilesManager }, { GenericServer }, { FilesWatcher }, { SettingsManager }] = await loadServerModules([
    'vscode/Connection.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'files/FilesWatcher.ts', 'settings/Settings.ts',
]);

async function until(predicate) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (predicate()) return;
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.fail('document lifecycle did not reach its expected state');
}

test('LSP document notifications create, edit, save and close a real file cache entry', async () => {
    const previous = {
        files: FilesManager.instance, server: GenericServer.instance,
        watcher: FilesWatcher.instance, settings: SettingsManager.instance,
    };
    const uri = 'file:///round136-unsaved.wcl.avt';
    const document = (version, content) => TextDocument.create(uri, 'typescript', version, content);
    const events = {};
    const callbacks = [];
    const diagnostics = [];
    const manager = Object.create(FilesManager.prototype);
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    FilesManager.instance = manager;
    GenericServer.instance = { isLoading: false, isDown: false, isIDE: true, logLevel: 99,
        connection: { sendDiagnostics: value => diagnostics.push(value) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    FilesWatcher.instance = { unwatch: value => callbacks.push(['unwatch', value]) };
    manager.onNewFile(async file => {
        callbacks.push(['open', file.versionUser, file.contentUser]);
        file.onContentChange(async current => callbacks.push(['change', current.versionUser, current.contentUser]));
        file.onSave(async current => callbacks.push(['save', current.versionUser, current.contentUser]));
        file.onDelete(async () => callbacks.push(['delete', file.versionUser]));
    });
    const adapter = Object.create(VsCodeConnection.prototype);
    adapter.documents = {
        onDidChangeContent: callback => { events.change = callback; },
        onDidSave: callback => { events.save = callback; },
        onDidClose: callback => { events.close = callback; },
    };
    adapter.addDocumentsAction();
    try {
        events.change({ document: document(1, 'first') });
        await until(() => manager.getByUri(uri)?.versionUser === 1);
        const cached = manager.getByUri(uri);
        events.change({ document: document(2, 'second') });
        await until(() => cached.versionUser === 2 && callbacks.some(item => item[0] === 'change'));
        events.save({ document: document(2, 'second') });
        await until(() => callbacks.some(item => item[0] === 'save'));
        events.close({ document: document(2, 'second') });
        await until(() => manager.getByUri(uri) === undefined);

        assert.deepEqual(callbacks, [
            ['open', 1, 'first'], ['change', 2, 'second'], ['save', 2, 'second'],
            ['delete', 2], ['unwatch', uri],
        ]);
        assert.deepEqual(diagnostics, [{ uri, diagnostics: [] }]);
    } finally {
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        for (const timer of Object.values(manager.lockedUpdatedUri)) clearTimeout(timer);
        FilesManager.instance = previous.files;
        GenericServer.instance = previous.server;
        FilesWatcher.instance = previous.watcher;
        SettingsManager.instance = previous.settings;
    }
});
