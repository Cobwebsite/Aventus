import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { GenericServer }, { FilesWatcher }, { SettingsManager }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'GenericServer.ts', 'files/FilesWatcher.ts', 'settings/Settings.ts', 'tools.ts',
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

test('disk update creates an unknown Aventus file, then refreshes its cached content and version', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-disk-'));
    const path = join(root, 'component.wcl.avt');
    const uri = pathToUri(path);
    const oldServer = GenericServer.instance;
    const oldWatcher = FilesWatcher.instance;
    const oldSettings = SettingsManager.instance;
    const events = [];
    GenericServer.instance = { isIDE: true, logLevel: 99, connection: { sendDiagnostics() {} } };
    FilesWatcher.instance = { watch() {}, unwatch() {} };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    const instance = manager();
    instance.onNewFile(async file => {
        events.push(['new', file.contentUser]);
        file.onContentChange(async current => events.push(['change', current.contentUser]));
        file.onSave(async current => events.push(['save', current.contentUser]));
    });
    try {
        writeFileSync(path, 'first');
        await instance.onUpdatedUri(uri);
        const file = instance.getByUri(uri);
        assert.equal(file.contentUser, 'first');
        const firstVersion = file.versionUser;
        writeFileSync(path, 'second');
        await instance.onUpdatedUri(uri);
        assert.equal(instance.getByUri(uri), file);
        assert.equal(file.contentUser, 'second');
        assert.equal(file.versionUser, firstVersion + 1);
        assert.deepEqual(events, [['new', 'first'], ['save', 'first'], ['change', 'second'], ['save', 'second']]);
    } finally {
        for (const file of Object.values(instance.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = oldServer;
        FilesWatcher.instance = oldWatcher;
        SettingsManager.instance = oldSettings;
        rmSync(root, { recursive: true, force: true });
    }
});

test('missing disk file update currently resolves before its asynchronous deletion finishes', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-missing-disk-'));
    const uri = pathToUri(join(root, 'removed.wcl.avt'));
    const oldServer = GenericServer.instance;
    const oldWatcher = FilesWatcher.instance;
    const oldSettings = SettingsManager.instance;
    const events = [];
    GenericServer.instance = {
        isIDE: true, logLevel: 99,
        connection: { sendDiagnostics: () => events.push('diagnostics') },
    };
    FilesWatcher.instance = { unwatch: () => events.push('unwatch') };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    const instance = manager();
    let finishDelete;
    const deletionGate = new Promise(resolve => { finishDelete = resolve; });
    instance.files[uri] = {
        triggerDelete: async () => {
            events.push('delete-start');
            await deletionGate;
            events.push('delete-end');
        },
    };
    try {
        await instance.onUpdatedUri(uri);
        assert.deepEqual(events, ['diagnostics', 'delete-start']);
        assert.ok(instance.getByUri(uri));
        finishDelete();
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(events, ['diagnostics', 'delete-start', 'delete-end', 'unwatch']);
        assert.equal(instance.getByUri(uri), undefined);
    } finally {
        finishDelete();
        GenericServer.instance = oldServer;
        FilesWatcher.instance = oldWatcher;
        SettingsManager.instance = oldSettings;
        rmSync(root, { recursive: true, force: true });
    }
});
