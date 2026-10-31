import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { ProjectManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'project/ProjectManager.ts', 'GenericServer.ts', 'tools.ts',
]);

test('merge ignores a stale document when its physical component source has disappeared', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-merge-missing-source-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const folder = join(root, 'Card');
    mkdirSync(folder);
    const path = join(folder, 'Card.wcl.avt');
    const uri = pathToUri(path);
    const content = 'export class Card {}';
    const documentUser = TextDocument.create(uri, 'typescript', 4, content);
    const staleFile = { uri, path, versionUser: 4, contentUser: content, documentUser };
    const previousFiles = FilesManager.getInstance;
    const previousProjects = ProjectManager.getInstance;
    const previousNotification = GenericServer.sendNotification;
    t.after(() => {
        FilesManager.getInstance = previousFiles;
        ProjectManager.getInstance = previousProjects;
        GenericServer.sendNotification = previousNotification;
    });
    const notifications = [];
    let renameCalls = 0;
    FilesManager.getInstance = () => ({
        getByUri: value => value === uri ? staleFile : undefined,
        onClose: () => assert.fail('stale source must stay registered'),
        registerFile: () => assert.fail('merge must not register an output'),
    });
    ProjectManager.getInstance = () => ({ onRename: async () => { renameCalls++; return {}; } });
    GenericServer.sendNotification = (...args) => notifications.push(args);

    await Commands.allCommandes['aventus.component.merge'].run(uri);

    assert.equal(renameCalls, 0);
    assert.equal(existsSync(join(root, 'Card.wc.avt')), false);
    assert.equal(existsSync(folder), true);
    assert.deepEqual(notifications, []);
});
