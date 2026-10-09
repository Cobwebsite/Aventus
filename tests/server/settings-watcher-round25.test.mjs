import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ SettingsManager }, { GenericServer }, { ProjectManager }, { FilesWatcher }, { pathToUri, uriToPath }] = await loadServerModules([
    'settings/Settings.ts', 'GenericServer.ts', 'project/ProjectManager.ts', 'files/FilesWatcher.ts', 'tools.ts',
]);

function settingsManager() {
    const manager = Object.create(SettingsManager.prototype);
    manager.firstInit = true;
    manager.cbOnSettingsChange = [];
    manager.cbOnSettingsChangeHtml = [];
    return manager;
}

test('settings callbacks run in registration order against a snapshot during re-entrant subscriptions', () => {
    const manager = settingsManager();
    const seen = [];
    manager.onSettingsChange(() => {
        seen.push(`first:${manager.settings.logLevel}`);
        if (seen.length === 1) manager.onSettingsChange(() => seen.push(`late:${manager.settings.logLevel}`));
    });
    manager.onSettingsChange(() => seen.push(`second:${manager.settings.logLevel}`));
    manager.initSettings({ logLevel: 1 });
    manager.initSettings({ logLevel: 2 });
    assert.deepEqual(seen, ['first:1', 'second:1', 'first:2', 'second:2', 'late:2']);
});

test('HTML settings callbacks use a snapshot and each update starts from defaults', () => {
    const manager = settingsManager();
    const seen = [];
    manager.onSettingsChangeHtml(() => {
        seen.push(`first:${manager.settingsHtml.customData.join(',')}`);
        if (seen.length === 1) manager.onSettingsChangeHtml(() => seen.push(`late:${manager.settingsHtml.customData.join(',')}`));
    });
    manager.onSettingsChangeHtml(() => seen.push(`second:${manager.settingsHtml.customData.join(',')}`));
    manager.setSettingsHtml({ customData: ['one.json', 'two.json'] });
    manager.setSettingsHtml({});
    assert.deepEqual(seen, ['first:one.json,two.json', 'second:one.json,two.json', 'first:', 'second:', 'late:']);
});

test('re-enabling IDE builds invokes the project manager after settings callbacks', () => {
    const manager = settingsManager();
    const previous = ProjectManager.getInstance;
    const events = [];
    ProjectManager.getInstance = () => ({ buildAll: () => events.push(`build:${manager.settings.ideBuild}`) });
    manager.onSettingsChange(() => events.push(`settings:${manager.settings.ideBuild}`));
    try {
        manager.initSettings({ ideBuild: true });
        manager.initSettings({ ideBuild: false });
        manager.initSettings({ ideBuild: true });
        assert.deepEqual(events, ['settings:true', 'settings:false', 'settings:true', 'build:true']);
    } finally {
        ProjectManager.getInstance = previous;
    }
});

test('setting a preference delegates the exact patch and scope to the server', () => {
    const manager = settingsManager();
    const previous = GenericServer.setSettings;
    const calls = [];
    GenericServer.setSettings = (...args) => calls.push(args);
    const patch = { readDirs: ['src'], liveserver: { port: 8020 } };
    try {
        manager.setSettings(patch, true);
        manager.setSettings({ ideBuild: false }, false);
        assert.deepEqual(calls, [[patch, true], [{ ideBuild: false }, false]]);
    } finally {
        GenericServer.setSettings = previous;
    }
});

test('watcher deduplicates subscriptions, unwatch stops dispatch, and rewatch subscribes again', async () => {
    const watcher = Object.create(FilesWatcher.prototype);
    const adds = [];
    watcher.watcher = { add: path => adds.push(path) };
    watcher.watcheUris = [];
    const path = 'D:/round25/rewatch.wcl.avt';
    const uri = pathToUri(path);
    watcher.watch(uri);
    watcher.watch(uri);
    assert.deepEqual(adds, [uriToPath(uri)]);
    assert.deepEqual(watcher.watcheUris, [uri]);
    watcher.unwatch(uri);
    watcher.unwatch(uri);
    assert.deepEqual(watcher.watcheUris, []);
    watcher.watch(uri);
    assert.deepEqual(adds, [uriToPath(uri), uriToPath(uri)]);
    assert.deepEqual(watcher.watcheUris, [uri]);
});
