import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [statsModule, settingsModule, serverModule] = await loadServerModules([
    'notification/Statistics.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);
const { Statistics } = statsModule;
const { SettingsManager } = settingsModule;
const { GenericServer } = serverModule;

test('statistics remain silent when disabled', () => {
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    const sent = [];
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4, connection: { sendNotification: (...args) => sent.push(args) } };
    try {
        Statistics.startSendLoadFile();
        Statistics.sendLoadFile();
        Statistics.startSendBuildTime('web');
        Statistics.sendBuildTime('web');
        Statistics.sendFileSize('unused', 'hello', 'build', 'web');
        assert.deepEqual(sent, []);
    } finally {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
    }
});

test('statistics send elapsed build times and UTF-8 file sizes when enabled', () => {
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    const sent = [];
    SettingsManager.instance = { settings: { useStats: true } };
    GenericServer.instance = { logLevel: 4, connection: { sendNotification: (...args) => sent.push(args) } };
    try {
        Statistics.startSendBuildTime('web');
        Statistics.sendBuildTime('web');
        Statistics.sendFileSize('result.js', 'é', 'build', 'web');
        assert.equal(sent[0][0], 'aventus/statistics/buildTime');
        assert.equal(sent[0][1][0], 'web');
        assert.equal(typeof sent[0][1][1], 'number');
        assert.deepEqual(sent[1], ['aventus/statistics/fileSize', ['result.js', 2, 'build', 'web']]);
    } finally {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
    }
});
