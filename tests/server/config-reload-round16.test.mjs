import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GenericServer }, { SettingsManager }, { Project }] = await loadServerModules([
    'GenericServer.ts', 'settings/Settings.ts', 'project/Project.ts',
]);

function makeSettings() {
    const settings = Object.create(SettingsManager.prototype);
    settings.firstInit = true;
    settings.cbOnSettingsChange = [];
    settings.cbOnSettingsChangeHtml = [];
    return settings;
}

test('configuration reload applies client settings and HTML data before notifying listeners', async () => {
    const previous = SettingsManager.instance;
    const settings = makeSettings();
    SettingsManager.instance = settings;
    const observed = [];
    settings.onSettingsChange(() => observed.push(['server', settings.settings.logLevel, settings.settings.liveserver.port]));
    settings.onSettingsChangeHtml(() => observed.push(['html', [...settings.settingsHtml.customData]]));
    const server = Object.create(GenericServer.prototype);
    server.connection = {
        getSettings: async () => ({ logLevel: 1, liveserver: { port: 9100 } }),
        getSettingsHtml: async () => ({ customData: ['first.json'] }),
    };
    try {
        await server.loadSettings();
        assert.deepEqual(observed, [['server', 1, 9100], ['html', ['first.json']]]);
        assert.equal(settings.settings.liveserver.host, '0.0.0.0');
    } finally {
        SettingsManager.instance = previous;
    }
});

test('configuration reload resets omitted overrides and accepts empty client responses', async () => {
    const previous = SettingsManager.instance;
    const settings = makeSettings();
    SettingsManager.instance = settings;
    const server = Object.create(GenericServer.prototype);
    let initial = true;
    server.connection = {
        getSettings: async () => initial ? { readDirs: ['src'], liveserver: { port: 9100 }, watchFiles: false } : null,
        getSettingsHtml: async () => initial ? { customData: ['first.json'] } : null,
    };
    try {
        await server.loadSettings();
        initial = false;
        await server.loadSettings();
        assert.deepEqual(settings.settings.readDirs, []);
        assert.equal(settings.settings.liveserver.port, 8080);
        assert.equal(settings.settings.watchFiles, true);
        assert.deepEqual(settings.settingsHtml.customData, []);
    } finally {
        SettingsManager.instance = previous;
    }
});

test('project configuration recovers after malformed JSON', async () => {
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    GenericServer.instance = { workspaces: ['file:///D:/app'], logLevel: 4 };
    SettingsManager.instance = { settings: { defaultHideWarnings: false } };
    const uri = 'file:///D:/app/aventus.conf.avt';
    const project = Object.create(Project.prototype);
    project.configFile = { documentUser: TextDocument.create(uri, 'json', 1, '{bad json') };
    project.config = null;
    project.builds = [];
    project.statics = [];
    try {
        await project.loadConfig();
        assert.equal(project.getConfig(), null);
        project.configFile.documentUser = TextDocument.create(uri, 'json', 2, '{"module":"Recovered","build":[{"src":[]}] }');
        await project.loadConfig();
        assert.equal(project.getConfig().module, 'Recovered');
        assert.deepEqual(project.builds, []);
    } finally {
        GenericServer.instance = oldServer;
        SettingsManager.instance = oldSettings;
    }
});
