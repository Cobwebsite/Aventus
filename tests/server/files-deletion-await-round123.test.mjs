import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { FilesWatcher }, { GenericServer }, { SettingsManager }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'files/FilesWatcher.ts', 'GenericServer.ts', 'settings/Settings.ts', 'tools.ts',
]);

for (const [label, invoke] of [
    ['disk update', (manager, uri) => manager.onUpdatedUri(uri)],
    ['document close', (manager, uri) => manager.onClose(TextDocument.create(uri, 'typescript', 1, 'old'))],
]) {
    test(`${label} of a missing file waits for deferred deletion`, async () => {
        const uri = pathToUri(join(tmpdir(), `aventus-round123-missing-${label.replace(' ', '-')}.wcl.avt`));
        const manager = Object.create(FilesManager.prototype);
        manager.files = {};
        manager.pendingRegistrations = new Map();
        const oldWatcher = FilesWatcher.instance;
        const oldServer = GenericServer.instance;
        const oldSendDiagnostics = GenericServer.sendDiagnostics;
        const oldSettings = SettingsManager.instance;
        const events = [];
        let releaseDelete;
        const deleteGate = new Promise(resolve => { releaseDelete = resolve; });
        manager.files = {
            [uri]: {
                triggerDelete: async () => {
                    events.push('delete-start');
                    await deleteGate;
                    events.push('delete-end');
                },
            },
        };
        manager.lockedUpdatedUri = {};
        GenericServer.instance = { logLevel: 99 };
        GenericServer.sendDiagnostics = () => events.push('diagnostics');
        SettingsManager.instance = { settings: { errorByBuild: false } };
        FilesWatcher.instance = { unwatch: () => events.push('unwatch') };
        try {
            let operationFinished = false;
            const operation = invoke(manager, uri).then(() => { operationFinished = true; });
            await new Promise(resolve => setImmediate(resolve));
            assert.deepEqual(events, ['diagnostics', 'delete-start']);
            assert.equal(manager.getByUri(uri), undefined, 'the cache releases the file before deletion callbacks finish');
            assert.equal(operationFinished, false);
            releaseDelete();
            await operation;
            assert.deepEqual(events, ['diagnostics', 'delete-start', 'delete-end', 'unwatch']);
            assert.equal(manager.getByUri(uri), undefined);
        } finally {
            releaseDelete();
            FilesWatcher.instance = oldWatcher;
            GenericServer.instance = oldServer;
            GenericServer.sendDiagnostics = oldSendDiagnostics;
            SettingsManager.instance = oldSettings;
        }
    });
}
