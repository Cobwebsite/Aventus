import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ SettingsManager }, { GenericServer }] = await loadServerModules([
    'settings/Settings.ts', 'GenericServer.ts',
]);

test('a partial hidden Store update retains the top level but replaces the nested Store object', t => {
    const directory = mkdtempSync(join(tmpdir(), 'aventus-hidden-partial-'));
    const previousServer = GenericServer.instance;
    const previousManager = SettingsManager.instance;
    t.after(() => {
        SettingsManager.instance = previousManager;
        GenericServer.instance = previousServer;
        rmSync(directory, { recursive: true, force: true });
    });
    const path = join(directory, 'config.json');
    writeFileSync(path, JSON.stringify({
        version: '2.0', store: { token: 'old-token', username: 'alice' },
    }));
    GenericServer.instance = { _savePath: directory };
    SettingsManager.instance = undefined;

    const settings = SettingsManager.getInstance();
    settings.setHiddenSettings({ store: { token: 'new-token' } });
    assert.equal(settings.hiddenSettings.version, '2.0');
    assert.deepEqual(settings.hiddenSettings.store, { token: 'new-token' });
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), {
        version: '2.0', store: { token: 'new-token' },
    });
});
