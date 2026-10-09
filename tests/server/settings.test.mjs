import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { SettingsManager } = await loadServerModule('settings/Settings.ts');

function managerWithoutFilesystem() {
    const manager = Object.create(SettingsManager.prototype);
    manager.firstInit = true;
    manager.cbOnSettingsChange = [];
    manager.cbOnSettingsChangeHtml = [];
    return manager;
}

test('settings initialize defaults and recursively merge live server overrides', () => {
    const manager = managerWithoutFilesystem();
    manager.initSettings({ liveserver: { port: 9000 }, readDirs: ['src'] });
    assert.equal(manager.settings.liveserver.port, 9000);
    assert.equal(manager.settings.liveserver.host, '0.0.0.0');
    assert.equal(manager.settings.liveserver.indexFile, 'index.html');
    assert.deepEqual(manager.settings.readDirs, ['src']);
    assert.equal(manager.settings.watchFiles, true);

    manager.initSettings({ liveserver: { host: '127.0.0.1' } });
    assert.equal(manager.settings.liveserver.host, '127.0.0.1');
    assert.equal(manager.settings.liveserver.port, 8080);
    assert.deepEqual(manager.settings.readDirs, []);
});

test('settings callbacks observe the new values', () => {
    const manager = managerWithoutFilesystem();
    const observed = [];
    manager.onSettingsChange(() => observed.push(manager.settings.logLevel));
    manager.initSettings({ logLevel: 1 });
    manager.initSettings({ logLevel: 2 });
    assert.deepEqual(observed, [1, 2]);

    manager.onSettingsChangeHtml(() => observed.push([...manager.settingsHtml.customData]));
    manager.setSettingsHtml({ customData: ['a.json'] });
    assert.deepEqual(observed[2], ['a.json']);
    manager.setSettingsHtml({});
    assert.deepEqual(manager.settingsHtml.customData, []);
});
