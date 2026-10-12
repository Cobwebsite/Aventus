import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { SettingsManager }, { InitStep }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'settings/Settings.ts', 'notification/InitStep.ts', 'tools.ts',
]);

test('failed file discovery leaves loading active until the caller retries', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-discovery-retry-'));
    const previousSettings = SettingsManager.instance;
    const previousSend = InitStep.send;
    const previousDone = InitStep.sendDone;
    try {
        const source = join(root, 'entry.wcl.avt');
        const config = join(root, 'aventus.conf.avt');
        writeFileSync(source, 'class Entry {}');
        writeFileSync(config, '{}');
        SettingsManager.instance = { settings: { readDirs: [] } };
        const steps = [];
        InitStep.send = message => steps.push(message);
        InitStep.sendDone = () => steps.push('done');
        const manager = Object.create(FilesManager.prototype);
        manager.loadingInProgress = false;
        const registered = [];
        let rejectFirst = true;
        manager.registerFile = async document => {
            if (rejectFirst) {
                rejectFirst = false;
                throw new Error('registration unavailable');
            }
            registered.push([document.uri, manager.loadingInProgress]);
        };

        await assert.rejects(manager.loadAllAventusFiles([pathToUri(root)]), /registration unavailable/);
        assert.equal(manager.loadingInProgress, true);
        assert.equal(steps.includes('done'), false);
        assert.deepEqual(registered, []);

        await manager.loadAllAventusFiles([pathToUri(root)]);
        assert.equal(manager.loadingInProgress, false);
        assert.equal(steps.filter(step => step === 'done').length, 1);
        assert.deepEqual(registered, [
            [pathToUri(source), true],
            [pathToUri(config), false],
        ]);
    } finally {
        SettingsManager.instance = previousSettings;
        InitStep.send = previousSend;
        InitStep.sendDone = previousDone;
        rmSync(root, { recursive: true, force: true });
    }
});
