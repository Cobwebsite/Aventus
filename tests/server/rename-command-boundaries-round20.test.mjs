import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { Rename }, { ProjectManager }, { SettingsManager }, { FilesManager }, { pathToUri }] = await loadServerModules([
    'cmds/index.ts', 'cmds/Rename.ts', 'project/ProjectManager.ts', 'settings/Settings.ts', 'files/FilesManager.ts', 'tools.ts',
]);

function withRouting(t, onRename, updateImportOnRename = true) {
    const project = ProjectManager.getInstance;
    const settings = SettingsManager.getInstance;
    const files = FilesManager.getInstance;
    ProjectManager.getInstance = () => ({ onRename });
    SettingsManager.getInstance = () => ({ settings: { updateImportOnRename } });
    FilesManager.getInstance = () => ({ getByUri: () => undefined });
    t.after(() => {
        ProjectManager.getInstance = project;
        SettingsManager.getInstance = settings;
        FilesManager.getInstance = files;
    });
}

test('folder rename before the filesystem move expands nested old paths into new URIs', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-rename-before-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const oldPath = join(root, 'old');
    const newPath = join(root, 'new');
    mkdirSync(join(oldPath, 'nested'), { recursive: true });
    writeFileSync(join(oldPath, 'nested', 'card.wcl.avt'), 'class Card {}');
    writeFileSync(join(oldPath, 'style.wcs.avt'), '.card {}');
    let received;
    withRouting(t, async changes => { received = changes; return {}; });
    await Rename.run([{ oldUri: pathToUri(oldPath), newUri: pathToUri(newPath) }]);
    assert.deepEqual(received, [
        { oldUri: pathToUri(join(oldPath, 'nested', 'card.wcl.avt')),
            newUri: pathToUri(join(newPath, 'nested', 'card.wcl.avt')) },
        { oldUri: pathToUri(join(oldPath, 'style.wcs.avt')),
            newUri: pathToUri(join(newPath, 'style.wcs.avt')) },
    ]);
});

test('rename setting disables expansion and project notifications', async t => {
    let calls = 0;
    withRouting(t, async () => { calls++; return {}; }, false);
    await Rename.run([{ oldUri: 'file:///missing-old', newUri: 'file:///missing-new' }]);
    assert.equal(calls, 0);
});
