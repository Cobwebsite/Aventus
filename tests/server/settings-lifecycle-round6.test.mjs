import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ SettingsManager }, { GenericServer }, { ProjectManager }] = await loadServerModules([
    'settings/Settings.ts', 'GenericServer.ts', 'project/ProjectManager.ts',
]);

test('enabling IDE builds after initialization rebuilds once per false-to-true transition', () => {
    const previous = ProjectManager.getInstance;
    const calls = [];
    ProjectManager.getInstance = () => ({ buildAll: () => calls.push('build') });
    try {
        const manager = Object.create(SettingsManager.prototype);
        manager.firstInit = true;
        manager.cbOnSettingsChange = [];
        manager.initSettings({ ideBuild: false });
        manager.initSettings({ ideBuild: true });
        manager.initSettings({ ideBuild: true });
        manager.initSettings({ ideBuild: false });
        manager.initSettings({ ideBuild: true });
        assert.deepEqual(calls, ['build', 'build']);
    } finally {
        ProjectManager.getInstance = previous;
    }
});

test('hidden settings load from disk and updates persist while keeping other top-level fields', () => {
    const directory = mkdtempSync(join(tmpdir(), 'aventus-settings-'));
    const previousServer = GenericServer.instance;
    const previousManager = SettingsManager.instance;
    GenericServer.instance = { _savePath: directory };
    SettingsManager.instance = undefined;
    try {
        writeFileSync(join(directory, 'config.json'), JSON.stringify({ version: '2.0', store: { token: 'old' } }));
        const manager = SettingsManager.getInstance();
        assert.equal(manager.hiddenSettings.version, '2.0');
        assert.equal(manager.hiddenSettings.store.token, 'old');
        manager.setHiddenSettings({ store: { token: 'new', username: 'alice' } });
        assert.deepEqual(JSON.parse(readFileSync(join(directory, 'config.json'), 'utf8')), {
            version: '2.0', store: { token: 'new', username: 'alice' },
        });
    } finally {
        SettingsManager.instance = previousManager;
        GenericServer.instance = previousServer;
        rmSync(directory, { recursive: true, force: true });
    }
});

test('invalid hidden-settings JSON falls back to defaults', () => {
    const directory = mkdtempSync(join(tmpdir(), 'aventus-settings-'));
    const previousServer = GenericServer.instance;
    const previousManager = SettingsManager.instance;
    GenericServer.instance = { _savePath: directory };
    SettingsManager.instance = undefined;
    try {
        writeFileSync(join(directory, 'config.json'), '{bad json');
        const manager = SettingsManager.getInstance();
        assert.deepEqual(manager.hiddenSettings, {
            version: '1.3.7', store: { token: '', username: '' },
        });
    } finally {
        SettingsManager.instance = previousManager;
        GenericServer.instance = previousServer;
        rmSync(directory, { recursive: true, force: true });
    }
});
