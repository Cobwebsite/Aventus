import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Statistics }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'notification/Statistics.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

function withNotifications(useStats, callback) {
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    const sent = [];
    SettingsManager.instance = { settings: { useStats } };
    GenericServer.instance = { logLevel: 4, connection: { sendNotification: (...args) => sent.push(args) } };
    try { callback(sent); } finally {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
    }
}

test('statistics report load, build and static timing through their distinct channels', () => {
    withNotifications(true, sent => {
        Statistics.startSendLoadFile();
        Statistics.startSendBuildTime('web');
        Statistics.startSendStaticTime('assets');
        Statistics.sendLoadFile();
        Statistics.sendBuildTime('web');
        Statistics.sendStaticTime('assets');
        assert.deepEqual(sent.map(([name]) => name), [
            'aventus/statistics/loadFileTime',
            'aventus/statistics/buildTime',
            'aventus/statistics/staticTime',
        ]);
        assert.equal(typeof sent[0][1][0], 'number');
        assert.equal(sent[1][1][0], 'web');
        assert.equal(typeof sent[1][1][1], 'number');
        assert.equal(sent[2][1][0], 'assets');
        assert.equal(typeof sent[2][1][1], 'number');
    });
});

test('file-size statistics use disk bytes when generated content is absent', () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-stats-'));
    const path = join(root, 'asset.txt');
    writeFileSync(path, 'é€');
    try {
        withNotifications(true, sent => {
            Statistics.sendFileSize(path, undefined, 'static', 'assets');
            assert.deepEqual(sent, [['aventus/statistics/fileSize', [path, 5, 'static', 'assets']]]);
        });
    } finally { rmSync(root, { recursive: true, force: true }); }
});

test('disabled statistics do not access absent files or emit static timing', () => {
    withNotifications(false, sent => {
        Statistics.startSendStaticTime('assets');
        Statistics.sendStaticTime('assets');
        assert.doesNotThrow(() => Statistics.sendFileSize('absent-file', undefined, 'manifest'));
        assert.deepEqual(sent, []);
    });
});
