import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ FilesManager }, { GenericServer }, { FilesWatcher }, { SettingsManager }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'GenericServer.ts', 'files/FilesWatcher.ts', 'settings/Settings.ts', 'tools.ts',
]);

test('batch registers every file before saving and validating any file', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-batch-order-'));
    const uris = ['first.wcl.avt', 'second.wcl.avt'].map(name => {
        const path = join(root, name);
        writeFileSync(path, name);
        return pathToUri(path);
    });
    const manager = new FilesManager();
    manager.files = {};
    manager.lockedUpdatedUri = {};
    const events = [];
    manager.registerFile = async document => {
        events.push(['register', document.uri]);
        manager.files[document.uri] = { versionUser: document.version };
    };
    manager.onSave = async document => {
        assert.deepEqual(manager.getUris().sort(), [...uris].sort());
        events.push(['save', document.uri]);
    };
    try {
        await manager.applyBatch({ created: uris, updated: [], deleted: [] });
        assert.deepEqual(events, [
            ['register', uris[0]], ['register', uris[1]],
            ['save', uris[0]], ['save', uris[1]],
        ]);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('batch preserves diagnostics when a deleted file is recreated in the same batch', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-batch-recreate-'));
    const path = join(root, 'recreated.wcl.avt');
    writeFileSync(path, 'new content');
    const uri = pathToUri(path);
    const old = [GenericServer.instance, FilesWatcher.instance, SettingsManager.instance];
    const diagnostics = [];
    const manager = new FilesManager();
    manager.files = { [uri]: {
        getBuild: () => null,
        triggerDelete: async () => {},
    } };
    manager.lockedUpdatedUri = {};
    manager.registerFile = async document => {
        manager.files[document.uri] = { versionUser: document.version };
    };
    manager.onSave = async () => {};
    GenericServer.instance = { logLevel: 99, connection: { sendDiagnostics: payload => diagnostics.push(payload) } };
    FilesWatcher.instance = { unwatch() {} };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    try {
        await manager.applyBatch({ created: [uri], updated: [], deleted: [uri] });
        assert.ok(manager.getByUri(uri));
        assert.deepEqual(diagnostics, []);
    } finally {
        [GenericServer.instance, FilesWatcher.instance, SettingsManager.instance] = old;
        rmSync(root, { recursive: true, force: true });
    }
});
