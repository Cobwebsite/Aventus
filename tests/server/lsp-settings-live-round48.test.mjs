import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GenericServer }, { SettingsManager }] = await loadServerModules([
    'GenericServer.ts', 'settings/Settings.ts',
]);

function createServer(connection) {
    const handlers = {};
    const proxy = new Proxy(connection, {
        get(target, key) {
            if (key in target) return target[key];
            if (String(key).startsWith('on')) return cb => { handlers[key] = cb; };
        },
    });
    return { server: new GenericServer(proxy), handlers };
}

test('configuration events replace live log filtering while preserving startup build mode and workspace order', async () => {
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    const oldLog = console.log;
    const logged = [];
    let current = { logLevel: 4, watchFiles: false };
    try {
        const { server, handlers } = createServer({
            getSettings: async () => current,
            getSettingsHtml: async () => ({}),
        });
        const settings = Object.create(SettingsManager.prototype);
        settings.firstInit = true;
        settings.cbOnSettingsChange = [];
        settings.cbOnSettingsChangeHtml = [];
        SettingsManager.instance = settings;
        settings.initSettings({});
        settings.setSettingsHtml({});
        console.log = value => logged.push(value);
        handlers.onInitialize({
            workspaceFolders: [{ uri: 'file:///first' }, { uri: 'file:///second' }],
            savePath: 'save', extensionPath: 'extension', isIDE: false, noBuild: true,
        });
        await server.loadSettings();
        GenericServer.information('hidden');
        GenericServer.error('always');
        assert.deepEqual(logged, ['always']);
        assert.equal(GenericServer.noBuild, true);
        assert.equal(GenericServer.getWorkspaceUri(), 'file:///first');

        current = { logLevel: 1, watchFiles: true };
        await handlers.onDidChangeConfiguration();
        await new Promise(resolve => setImmediate(resolve));
        GenericServer.information('visible');
        assert.deepEqual(logged, ['always', 'visible']);
        assert.equal(settings.settings.watchFiles, true);
        assert.equal(GenericServer.noBuild, true);

        current = {};
        await handlers.onDidChangeConfiguration();
        await new Promise(resolve => setImmediate(resolve));
        GenericServer.information('hidden again');
        assert.deepEqual(logged, ['always', 'visible']);
        assert.equal(settings.settings.watchFiles, true);
        assert.equal(GenericServer.noBuild, true);
    } finally {
        console.log = oldLog;
        GenericServer.instance = oldServer;
        SettingsManager.instance = oldSettings;
    }
});

test('configuration notification returns before an asynchronous settings refresh finishes', async () => {
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    let release;
    let requests = 0;
    const pending = new Promise(resolve => { release = resolve; });
    try {
        const { handlers } = createServer({
            getSettings: () => { requests++; return pending; },
            getSettingsHtml: async () => ({ customData: ['late.json'] }),
        });
        const settings = Object.create(SettingsManager.prototype);
        settings.firstInit = true;
        settings.cbOnSettingsChange = [];
        settings.cbOnSettingsChangeHtml = [];
        SettingsManager.instance = settings;
        settings.initSettings({});
        settings.setSettingsHtml({});
        const result = await handlers.onDidChangeConfiguration();
        assert.equal(result, undefined);
        assert.equal(requests, 1);
        assert.equal(settings.settingsHtml.customData.length, 0);
        release({ logLevel: 1 });
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(settings.settings.logLevel, 1);
        assert.deepEqual(settings.settingsHtml.customData, ['late.json']);
    } finally {
        release?.({});
        GenericServer.instance = oldServer;
        SettingsManager.instance = oldSettings;
    }
});
