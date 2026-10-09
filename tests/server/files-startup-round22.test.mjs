import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { SettingsManager }, { InitStep }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'settings/Settings.ts', 'notification/InitStep.ts', 'tools.ts',
]);

test('full workspace loading registers ordinary files before configurations from every root', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-full-workspaces-'));
    const first = join(root, 'first');
    const second = join(root, 'second');
    const oldSettings = SettingsManager.instance;
    const oldSend = InitStep.send;
    const oldDone = InitStep.sendDone;
    const registered = [];
    const progress = [];
    const manager = Object.create(FilesManager.prototype);
    manager.loadingInProgress = false;
    manager.registerFile = async document => {
        registered.push([document.uri, document.getText(), manager.loadingInProgress]);
    };
    SettingsManager.instance = { settings: { readDirs: [] } };
    InitStep.send = message => progress.push(message);
    InitStep.sendDone = () => progress.push('done');
    try {
        for (const folder of [first, second, join(first, 'node_modules'), join(second, '.git')]) {
            mkdirSync(folder, { recursive: true });
        }
        writeFileSync(join(first, 'a.wcl.avt'), 'class A {}');
        writeFileSync(join(first, 'aventus.conf.avt'), '{"module":"a"}');
        writeFileSync(join(second, 'b.wcl.avt'), 'class B {}');
        writeFileSync(join(second, 'aventus.conf.avt'), '{"module":"b"}');
        writeFileSync(join(first, 'node_modules', 'ignored.wcl.avt'), 'class Ignored {}');
        writeFileSync(join(second, '.git', 'aventus.conf.avt'), '{}');

        await manager.loadAllAventusFiles([pathToUri(first), pathToUri(second)]);

        assert.deepEqual(registered.map(([uri]) => uri), [
            pathToUri(join(first, 'a.wcl.avt')),
            pathToUri(join(second, 'b.wcl.avt')),
            pathToUri(join(first, 'aventus.conf.avt')),
            pathToUri(join(second, 'aventus.conf.avt')),
        ]);
        assert.deepEqual(registered.map(([, content]) => content), [
            'class A {}', 'class B {}', '{"module":"a"}', '{"module":"b"}',
        ]);
        assert.deepEqual(registered.map(([, , loading]) => loading), [true, true, false, false]);
        assert.deepEqual(progress, [
            '$(loading~spin) Aventus : Loading files',
            '$(loading~spin) Aventus : Register config',
            'done',
        ]);
        assert.equal(manager.loadingInProgress, false);
    } finally {
        SettingsManager.instance = oldSettings;
        InitStep.send = oldSend;
        InitStep.sendDone = oldDone;
        rmSync(root, { recursive: true, force: true });
    }
});
