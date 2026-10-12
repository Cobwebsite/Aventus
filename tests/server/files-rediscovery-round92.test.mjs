import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { SettingsManager }, { GenericServer }, { InitStep }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'settings/Settings.ts', 'GenericServer.ts', 'notification/InitStep.ts', 'tools.ts',
]);

test('rediscovery updates a cached file, registers a new sibling, and preserves URI/path identity', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-rediscovery-round92-'));
    const firstPath = join(root, 'first.wcl.avt');
    const secondPath = join(root, 'second.wcl.avt');
    const firstUri = pathToUri(firstPath);
    const secondUri = pathToUri(secondPath);
    const previous = [SettingsManager.instance, GenericServer.instance, InitStep.send, InitStep.sendDone];
    const manager = Object.create(FilesManager.prototype);
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    const events = [];
    SettingsManager.instance = { settings: { readDirs: [], errorByBuild: false } };
    GenericServer.instance = { isIDE: true, logLevel: 99, connection: { sendNotification() {}, sendDiagnostics() {} } };
    InitStep.send = () => {};
    InitStep.sendDone = () => {};
    manager.onNewFile(async file => {
        events.push(['new', file.uri, file.contentUser]);
        file.onContentChange(async changed => events.push(['change', changed.uri, changed.contentUser]));
    });
    try {
        writeFileSync(firstPath, 'class First {}');
        await manager.loadAllAventusFiles([pathToUri(root)]);
        const first = manager.getByUri(firstUri);
        assert.equal(manager.getByPath(firstPath), first);

        writeFileSync(firstPath, 'class Updated {}');
        writeFileSync(secondPath, 'class Second {}');
        await manager.loadAllAventusFiles([pathToUri(root)]);

        assert.equal(manager.getByUri(firstUri), first);
        assert.equal(manager.getByPath(firstPath), first);
        assert.equal(first.contentUser, 'class Updated {}');
        assert.equal(manager.getByPath(secondPath), manager.getByUri(secondUri));
        assert.deepEqual(new Set(manager.getUris()), new Set([firstUri, secondUri]));
        assert.deepEqual(events, [
            ['new', firstUri, 'class First {}'],
            ['change', firstUri, 'class Updated {}'],
            ['new', secondUri, 'class Second {}'],
        ]);
    } finally {
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        [SettingsManager.instance, GenericServer.instance, InitStep.send, InitStep.sendDone] = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
