import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { SettingsManager }, { InitStep }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'settings/Settings.ts', 'notification/InitStep.ts', 'GenericServer.ts', 'tools.ts',
]);

test('failed registration is reported while discovery continues to configuration', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-discovery-retry-'));
    const previousSettings = SettingsManager.instance;
    const previousSend = InitStep.send;
    const previousDone = InitStep.sendDone;
    const previousError = GenericServer.showErrorMessage;
    try {
        const source = join(root, 'entry.wcl.avt');
        const healthy = join(root, 'healthy.wcl.avt');
        const config = join(root, 'aventus.conf.avt');
        writeFileSync(source, 'class Entry {}');
        writeFileSync(healthy, 'class Healthy {}');
        writeFileSync(config, '{}');
        SettingsManager.instance = { settings: { readDirs: [] } };
        const steps = [];
        const errors = [];
        InitStep.send = message => steps.push(message);
        InitStep.sendDone = () => steps.push('done');
        GenericServer.showErrorMessage = message => errors.push(message);
        const manager = Object.create(FilesManager.prototype);
        manager.files = {};
        manager.pendingRegistrations = new Map();
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

        await manager.loadAllAventusFiles([pathToUri(root)]);
        assert.equal(manager.loadingInProgress, false);
        assert.equal(steps.filter(step => step === 'done').length, 1);
        assert.deepEqual(registered, [
            [pathToUri(healthy), true],
            [pathToUri(config), false],
        ]);
        assert.equal(errors.length, 1);
        assert.match(errors[0], /entry\.wcl\.avt: registration unavailable/);
    } finally {
        SettingsManager.instance = previousSettings;
        InitStep.send = previousSend;
        InitStep.sendDone = previousDone;
        GenericServer.showErrorMessage = previousError;
        rmSync(root, { recursive: true, force: true });
    }
});
