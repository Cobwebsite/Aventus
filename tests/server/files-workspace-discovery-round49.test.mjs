import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { SettingsManager }, { InitStep }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'settings/Settings.ts', 'notification/InitStep.ts', 'tools.ts',
]);

test('readDirs applies independently to each workspace for config and ordinary file discovery', async () => {
    const root = mkdtempSync(join(process.cwd(), 'aventus-round49-roots-'));
    const previousSettings = SettingsManager.instance;
    const previousSend = InitStep.send;
    const previousDone = InitStep.sendDone;
    const first = join(root, 'first');
    const second = join(root, 'second');
    const expected = [];
    try {
        for (const workspace of [first, second]) {
            for (const directory of ['src', 'other', 'node_modules', '.git']) {
                mkdirSync(join(workspace, directory), { recursive: true });
            }
            writeFileSync(join(workspace, 'src', 'aventus.conf.avt'), JSON.stringify({ module: workspace }));
            writeFileSync(join(workspace, 'src', 'entry.wcl.avt'), `class ${workspace === first ? 'First' : 'Second'} {}`);
            writeFileSync(join(workspace, 'other', 'aventus.conf.avt'), '{}');
            writeFileSync(join(workspace, 'other', 'ignored.wcl.avt'), 'class Ignored {}');
            writeFileSync(join(workspace, 'node_modules', 'aventus.conf.avt'), '{}');
            writeFileSync(join(workspace, '.git', 'entry.wcl.avt'), 'class Hidden {}');
            expected.push(pathToUri(join(workspace, 'src', 'aventus.conf.avt')));
        }
        SettingsManager.instance = { settings: { readDirs: ['src'] } };
        InitStep.send = () => {};
        InitStep.sendDone = () => {};
        const manager = Object.create(FilesManager.prototype);
        manager.loadingInProgress = false;
        const registered = [];
        manager.registerFile = async document => registered.push([document.uri, manager.loadingInProgress]);
        const workspaces = [pathToUri(first), pathToUri(second)];

        const configs = await manager.loadAllAventusConfigFiles(workspaces);
        assert.deepEqual(configs.map(file => file.uri), expected);

        await manager.loadAllAventusFiles(workspaces);
        assert.deepEqual(registered, [
            [pathToUri(join(first, 'src', 'entry.wcl.avt')), true],
            [pathToUri(join(second, 'src', 'entry.wcl.avt')), true],
            [expected[0], false],
            [expected[1], false],
        ]);
        assert.equal(manager.loadingInProgress, false);
    } finally {
        SettingsManager.instance = previousSettings;
        InitStep.send = previousSend;
        InitStep.sendDone = previousDone;
        rmSync(root, { recursive: true, force: true });
    }
});
