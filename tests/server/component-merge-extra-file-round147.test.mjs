import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { ProjectManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'project/ProjectManager.ts', 'GenericServer.ts', 'tools.ts',
]);

test('merge refuses a component folder containing an unrelated file without changing its sources', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-merge-extra-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const folder = join(root, 'Card');
    mkdirSync(folder);
    const scriptPath = join(folder, 'Card.wcl.avt');
    const viewPath = join(folder, 'Card.wcv.avt');
    const notePath = join(folder, 'README.md');
    const sources = [
        [scriptPath, 'export class Card {}'],
        [viewPath, '<p>Card</p>'],
        [notePath, 'keep me'],
    ];
    for (const [path, content] of sources) writeFileSync(path, content);
    const files = new Map(sources.slice(0, 2).map(([path, content]) => {
        const uri = pathToUri(path);
        return [uri, { uri, path, versionUser: 2, contentUser: content,
            documentUser: TextDocument.create(uri, 'text', 2, content) }];
    }));
    const previousFiles = FilesManager.getInstance;
    const previousProjects = ProjectManager.getInstance;
    const previousError = GenericServer.showErrorMessage;
    const previousNotification = GenericServer.sendNotification;
    const errors = [];
    const notifications = [];
    let renameCalls = 0;
    FilesManager.getInstance = () => ({
        getByUri: uri => files.get(uri),
        onClose: () => assert.fail('merge must not close source files'),
        registerFile: () => assert.fail('merge must not register a component'),
    });
    ProjectManager.getInstance = () => ({ onRename: async () => { renameCalls++; return {}; } });
    GenericServer.showErrorMessage = message => errors.push(message);
    GenericServer.sendNotification = (...args) => notifications.push(args);
    t.after(() => {
        FilesManager.getInstance = previousFiles;
        ProjectManager.getInstance = previousProjects;
        GenericServer.showErrorMessage = previousError;
        GenericServer.sendNotification = previousNotification;
    });

    await Commands.allCommandes['aventus.component.merge'].run(pathToUri(viewPath));

    assert.equal(renameCalls, 0);
    assert.equal(existsSync(join(root, 'Card.wc.avt')), false);
    assert.equal(existsSync(folder), true);
    for (const [path, content] of sources) assert.equal(readFileSync(path, 'utf8'), content);
    assert.deepEqual(notifications, []);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /README\.md/);
});
