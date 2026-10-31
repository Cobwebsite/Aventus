import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ FilesManager }, { SettingsManager }, { InitStep }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'settings/Settings.ts', 'notification/InitStep.ts', 'tools.ts',
]);

test('overlapping workspace roots discover each configuration and source once', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-overlap-roots-'));
    const nested = join(root, 'nested');
    const config = join(nested, 'aventus.conf.avt');
    const source = join(nested, 'entry.wcl.avt');
    const previousSettings = SettingsManager.instance;
    const previousSend = InitStep.send;
    const previousDone = InitStep.sendDone;
    try {
        mkdirSync(nested);
        writeFileSync(config, '{}');
        writeFileSync(source, 'class Entry {}');
        SettingsManager.instance = { settings: { readDirs: [] } };
        InitStep.send = () => {};
        InitStep.sendDone = () => {};
        const manager = Object.create(FilesManager.prototype);
        manager.files = {};
        manager.pendingRegistrations = new Map();
        manager.loadingInProgress = false;
        const registered = [];
        manager.registerFile = async document => registered.push(document.uri);
        for (const workspaces of [[pathToUri(root), pathToUri(nested)], [pathToUri(nested), pathToUri(root)]]) {
            registered.length = 0;
            const configs = await manager.loadAllAventusConfigFiles(workspaces);
            assert.deepEqual(configs.map(file => file.uri), [pathToUri(config)]);

            await manager.loadAllAventusFiles(workspaces);
            assert.deepEqual(registered, [pathToUri(source), pathToUri(config)]);
        }
    } finally {
        SettingsManager.instance = previousSettings;
        InitStep.send = previousSend;
        InitStep.sendDone = previousDone;
        rmSync(root, { recursive: true, force: true });
    }
});
