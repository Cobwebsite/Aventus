import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { GenericServer }, { SettingsManager }, { FilesWatcher }] = await loadServerModules([
    'files/FilesManager.ts', 'GenericServer.ts', 'settings/Settings.ts', 'files/FilesWatcher.ts',
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

test('new file callbacks finish before registration resolves and deregistered callbacks stay silent', async () => {
    const current = manager();
    const previousServer = GenericServer.instance;
    const previousWatcher = FilesWatcher.instance;
    const events = [];
    let finishFirst;
    const gate = new Promise(resolve => { finishFirst = resolve; });
    GenericServer.instance = { isIDE: false, logLevel: 99 };
    FilesWatcher.instance = { watch: uri => events.push(`watch:${uri}`) };
    try {
        const firstId = current.onNewFile(async file => {
            events.push(`first:${file.uri}`);
            await gate;
            events.push(`first-done:${file.uri}`);
        });
        const removedId = current.onNewFile(async () => { throw Error('removed callback invoked'); });
        current.removeOnNewFile(removedId);
        const uri = 'file:///round12-first.wcl.avt';
        const registering = current.registerFile(TextDocument.create(uri, 'typescript', 1, 'first'));
        await Promise.resolve();
        assert.deepEqual(events, [`first:${uri}`]);
        finishFirst();
        const file = await registering;
        assert.equal(file, current.getByUri(uri));
        assert.deepEqual(events, [`first:${uri}`, `first-done:${uri}`, `watch:${uri}`]);

        current.removeOnNewFile(firstId);
        const secondUri = 'file:///round12-second.wcl.avt';
        await current.registerFile(TextDocument.create(secondUri, 'typescript', 1, 'second'));
        assert.deepEqual(events, [`first:${uri}`, `first-done:${uri}`, `watch:${uri}`, `watch:${secondUri}`]);
    } finally {
        finishFirst();
        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        FilesWatcher.instance = previousWatcher;
    }
});

test('deleting a file clears diagnostics independently for every associated build', async () => {
    const current = manager();
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    const previousWatcher = FilesWatcher.instance;
    const uri = 'file:///round12-built.wcl.avt';
    const sent = [];
    const events = [];
    GenericServer.instance = { logLevel: 99, connection: { sendDiagnostics: (params, build) => sent.push([params, build]) } };
    SettingsManager.instance = { settings: { errorByBuild: true } };
    FilesWatcher.instance = { unwatch: value => events.push(`unwatch:${value}`) };
    current.files[uri] = {
        getBuild: () => [{ buildConfig: { fullname: 'alpha' } }, { buildConfig: { fullname: 'beta' } }],
        triggerDelete: async () => events.push('delete'),
    };
    try {
        await current.onDeletedUri(uri);
        assert.deepEqual(sent, [
            [{ uri, diagnostics: [] }, 'alpha'],
            [{ uri, diagnostics: [] }, 'beta'],
        ]);
        assert.deepEqual(events, ['delete', `unwatch:${uri}`]);
        assert.equal(current.getByUri(uri), undefined);
        await current.onDeletedUri(uri);
        assert.equal(sent.length, 2);
    } finally {
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
        FilesWatcher.instance = previousWatcher;
    }
});
