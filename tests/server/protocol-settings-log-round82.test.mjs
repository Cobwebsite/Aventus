import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GenericServer }, { SettingsManager }, { LogLevel }] = await loadServerModules([
    'GenericServer.ts', 'settings/Settings.ts', 'settings/LogLevel.ts',
]);

test('live log level filters both console and log file while explicit errors remain recorded', t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-log-level-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const logFile = join(root, 'server.log');
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    const oldConsole = console.log;
    t.after(() => {
        GenericServer.instance = oldServer;
        SettingsManager.instance = oldSettings;
        console.log = oldConsole;
    });
    const handlers = {};
    const connection = new Proxy({}, {
        get(_target, key) {
            if (String(key).startsWith('on')) return callback => { handlers[key] = callback; };
        },
    });
    const server = new GenericServer(connection);
    const settings = Object.create(SettingsManager.prototype);
    settings.firstInit = true;
    settings.cbOnSettingsChange = [];
    settings.cbOnSettingsChangeHtml = [];
    SettingsManager.instance = settings;
    settings.initSettings({ logLevel: LogLevel.Warning });
    handlers.onInitialize({ savePath: root, extensionPath: root, logFile, isIDE: false });
    const lines = [];
    console.log = line => lines.push(line);

    GenericServer.information('hidden-info');
    GenericServer.warning('visible-warning');
    settings.initSettings({ logLevel: LogLevel.Debug });
    GenericServer.debug({ phase: 'debug-visible' });
    settings.initSettings({ logLevel: LogLevel.None });
    GenericServer.warning('hidden-warning');
    GenericServer.error('explicit-error');

    assert.deepEqual(lines, ['visible-warning', { phase: 'debug-visible' }, 'explicit-error']);
    const entries = readFileSync(logFile, 'utf8').trim().split('\n');
    assert.equal(entries.length, 5);
    assert.match(entries[0], /^\[\d{4}-\d\d-\d\dT.*\] visible-warning$/);
    assert.match(entries.slice(1, 4).join('\n'), /"phase": "debug-visible"/);
    assert.match(entries[4], /^\[\d{4}-\d\d-\d\dT.*\] explicit-error$/);
    assert.doesNotMatch(readFileSync(logFile, 'utf8'), /hidden-info|hidden-warning/);
    assert.equal(GenericServer.noBuild, false);
    assert.equal(server._logFile, logFile);
});

test('explicit settings refresh replaces both settings categories in order and preserves startup noBuild', async t => {
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    t.after(() => {
        GenericServer.instance = oldServer;
        SettingsManager.instance = oldSettings;
    });
    const settings = Object.create(SettingsManager.prototype);
    settings.firstInit = true;
    settings.cbOnSettingsChange = [];
    settings.cbOnSettingsChangeHtml = [];
    SettingsManager.instance = settings;
    settings.setSettingsHtml({});
    let live = { logLevel: LogLevel.Debug, liveserver: { port: 9123 } };
    let html = { customData: ['old.json'] };
    const events = [];
    settings.onSettingsChange(() => events.push(['live', settings.settings.logLevel, settings.settingsHtml.customData]));
    settings.onSettingsChangeHtml(() => events.push(['html', settings.settingsHtml.customData]));
    const server = Object.create(GenericServer.prototype);
    server._noBuild = true;
    server.connection = {
        getSettings: async () => live,
        getSettingsHtml: async () => html,
    };
    GenericServer.instance = server;
    await GenericServer.refreshSettings();
    live = null;
    html = null;
    await GenericServer.refreshSettings();

    assert.deepEqual(events.map(event => event[0]), ['live', 'html', 'live', 'html']);
    assert.equal(events[2][1], LogLevel.Error);
    assert.deepEqual(events[2][2], ['old.json']);
    assert.deepEqual(settings.settingsHtml.customData, []);
    assert.equal(settings.settings.liveserver.port, 8080);
    assert.equal(GenericServer.noBuild, true);
});
