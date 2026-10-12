import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { SettingsManager }, { InitStep }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'settings/Settings.ts', 'notification/InitStep.ts', 'tools.ts',
]);

test('a readDirs file entry currently admits sibling Aventus files in the same directory', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-read-file-'));
    const priorSettings = SettingsManager.instance;
    const priorSend = InitStep.send;
    const priorDone = InitStep.sendDone;
    try {
        const src = join(root, 'src');
        mkdirSync(src);
        const wanted = join(src, 'wanted.wcl.avt');
        const sibling = join(src, 'sibling.wcl.avt');
        const nested = join(src, 'nested', 'nested.wcl.avt');
        mkdirSync(join(src, 'nested'));
        writeFileSync(wanted, 'class Wanted {}');
        writeFileSync(sibling, 'class Sibling {}');
        writeFileSync(nested, 'class Nested {}');
        SettingsManager.instance = { settings: { readDirs: ['src/wanted.wcl.avt'] } };
        InitStep.send = () => {};
        InitStep.sendDone = () => {};
        const manager = Object.create(FilesManager.prototype);
        const registered = [];
        manager.registerFile = async document => registered.push(document.uri);
        await manager.loadAllAventusFiles([pathToUri(root)]);
        assert.deepEqual(registered.sort(), [pathToUri(sibling), pathToUri(wanted)].sort());
        assert.ok(!registered.includes(pathToUri(nested)));
    } finally {
        SettingsManager.instance = priorSettings;
        InitStep.send = priorSend;
        InitStep.sendDone = priorDone;
        rmSync(root, { recursive: true, force: true });
    }
});
