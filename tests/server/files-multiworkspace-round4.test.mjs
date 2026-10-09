import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { SettingsManager }, { GenericServer }, { FilesWatcher }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'settings/Settings.ts', 'GenericServer.ts', 'files/FilesWatcher.ts', 'tools.ts',
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

test('workspace discovery keeps separate configurations and ignores Git and npm trees in each root', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-roots-'));
    const oldSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { readDirs: [] } };
    try {
        const first = join(root, 'first');
        const second = join(root, 'second');
        for (const path of [first, second, join(first, '.git'), join(second, 'node_modules')]) mkdirSync(path, { recursive: true });
        writeFileSync(join(first, 'aventus.conf.avt'), '{"module":"First"}');
        writeFileSync(join(second, 'aventus.conf.avt'), '{"module":"Second"}');
        writeFileSync(join(first, '.git', 'aventus.conf.avt'), '{}');
        writeFileSync(join(second, 'node_modules', 'aventus.conf.avt'), '{}');
        const found = await manager().loadAllAventusConfigFiles([pathToUri(first), pathToUri(second)]);
        assert.deepEqual(found.map(file => [file.uri, file.contentUser]).sort(), [
            [pathToUri(join(first, 'aventus.conf.avt')), '{"module":"First"}'],
            [pathToUri(join(second, 'aventus.conf.avt')), '{"module":"Second"}'],
        ].sort());
    } finally {
        SettingsManager.instance = oldSettings;
        rmSync(root, { recursive: true, force: true });
    }
});

test('nested workspace roots currently discover the child configuration twice', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-nested-roots-'));
    const oldSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { readDirs: [] } };
    try {
        const child = join(root, 'child');
        mkdirSync(child);
        const config = join(child, 'aventus.conf.avt');
        writeFileSync(config, '{"module":"Child"}');
        const found = await manager().loadAllAventusConfigFiles([pathToUri(root), pathToUri(child)]);
        assert.deepEqual(found.map(file => file.uri), [pathToUri(config), pathToUri(config)]);
        assert.notEqual(found[0], found[1]);
    } finally {
        SettingsManager.instance = oldSettings;
        rmSync(root, { recursive: true, force: true });
    }
});

test('nested roots currently attempt to register each child Aventus file twice', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-nested-registration-'));
    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    SettingsManager.instance = { settings: { readDirs: [] } };
    GenericServer.instance = { logLevel: 99, connection: { sendNotification: () => {} } };
    try {
        const child = join(root, 'child');
        mkdirSync(child);
        const config = join(child, 'aventus.conf.avt');
        const logic = join(child, 'entry.wcl.avt');
        writeFileSync(config, '{}');
        writeFileSync(logic, 'class Entry {}');
        const current = manager();
        const registrations = [];
        current.registerFile = async document => registrations.push(document.uri);
        await current.loadAllAventusFiles([pathToUri(root), pathToUri(child)]);
        assert.deepEqual(registrations, [
            pathToUri(logic), pathToUri(logic), pathToUri(config), pathToUri(config),
        ]);
        assert.equal(current.loadingInProgress, false);
    } finally {
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        rmSync(root, { recursive: true, force: true });
    }
});

test('real file cache turns the second nested-root registration into a content-change event', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-nested-cache-'));
    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    SettingsManager.instance = { settings: { readDirs: [], errorByBuild: false } };
    GenericServer.instance = {
        isIDE: true, logLevel: 99,
        connection: { sendNotification: () => {}, sendDiagnostics: () => {} },
    };
    const current = manager();
    try {
        const child = join(root, 'child');
        mkdirSync(child);
        const logic = join(child, 'entry.wcl.avt');
        writeFileSync(logic, 'class Entry {}');
        const events = [];
        current.onNewFile(async file => {
            events.push(['create', file.uri]);
            file.onContentChange(async changed => events.push(['change', changed.uri]));
        });
        await current.loadAllAventusFiles([pathToUri(root), pathToUri(child)]);
        assert.deepEqual(events, [
            ['create', pathToUri(logic)],
            ['change', pathToUri(logic)],
        ]);
        assert.deepEqual(current.getUris(), [pathToUri(logic)]);
    } finally {
        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        rmSync(root, { recursive: true, force: true });
    }
});

test('deletion clears diagnostics for every build associated with the file before removing it', async () => {
    const current = manager();
    const uri = 'file:///d%3A/project/entry.wcl.avt';
    const old = [SettingsManager.instance, GenericServer.instance, FilesWatcher.instance];
    const sent = [];
    const events = [];
    SettingsManager.instance = { settings: { errorByBuild: true } };
    GenericServer.instance = { logLevel: 99, connection: { sendDiagnostics: (params, build) => sent.push([params, build]) } };
    FilesWatcher.instance = { unwatch: value => events.push(['unwatch', value]) };
    current.files[uri] = {
        getBuild: () => [{ buildConfig: { fullname: 'Demo.A' } }, { buildConfig: { fullname: 'Demo.B' } }],
        triggerDelete: async () => { events.push(['delete', uri]); },
    };
    try {
        await current.onDeletedUri(uri);
        assert.deepEqual(sent, [
            [{ uri, diagnostics: [] }, 'Demo.A'],
            [{ uri, diagnostics: [] }, 'Demo.B'],
        ]);
        assert.deepEqual(events, [['delete', uri], ['unwatch', uri]]);
        assert.equal(current.getByUri(uri), undefined);
    } finally {
        [SettingsManager.instance, GenericServer.instance, FilesWatcher.instance] = old;
    }
});
