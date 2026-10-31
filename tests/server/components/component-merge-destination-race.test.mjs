import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { GenericServer }, { ProjectManager }, { pathToUri, uriToPath }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'project/ProjectManager.ts', 'tools.ts',
]);

test('merge observes a destination created while project rename is pending', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-merge-destination-race-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        files: FilesManager.getInstance,
        projects: ProjectManager.getInstance,
        notify: GenericServer.sendNotification,
        error: GenericServer.showErrorMessage,
    };
    t.after(() => {
        FilesManager.getInstance = previous.files;
        ProjectManager.getInstance = previous.projects;
        GenericServer.sendNotification = previous.notify;
        GenericServer.showErrorMessage = previous.error;
    });

    const folder = join(root, 'Card');
    mkdirSync(folder);
    const logic = join(folder, 'Card.wcl.avt');
    const view = join(folder, 'Card.wcv.avt');
    const destination = join(root, 'Card.wc.avt');
    const files = new Map();
    for (const [path, content] of [[logic, 'export class Card {}'], [view, '<p>card</p>']]) {
        writeFileSync(path, content);
        const uri = pathToUri(path);
        const documentUser = TextDocument.create(uri, 'text', 1, content);
        files.set(uri, { uri, path: uriToPath(uri), documentUser, contentUser: content, versionUser: 1 });
    }
    const notifications = [];
    const errors = [];
    FilesManager.getInstance = () => ({
        getByUri: uri => files.get(uri),
        onClose: document => files.delete(document.uri),
        registerFile: document => files.set(document.uri, {
            uri: document.uri, path: uriToPath(document.uri), documentUser: document,
            contentUser: document.getText(), versionUser: document.version,
        }),
    });
    GenericServer.sendNotification = (...event) => notifications.push(event);
    GenericServer.showErrorMessage = message => errors.push(message);
    let releaseRename;
    const enteredRename = new Promise(resolve => {
        ProjectManager.getInstance = () => ({ onRename: async () => {
            resolve();
            return new Promise(complete => { releaseRename = complete; });
        } });
    });

    const pending = Commands.allCommandes['aventus.component.merge'].run(pathToUri(logic));
    await enteredRename;
    assert.equal(existsSync(destination), false);
    writeFileSync(destination, '<script>export class Other {}</script>');
    releaseRename({});
    await pending;

    assert.equal(existsSync(folder), true);
    assert.equal(readFileSync(destination, 'utf8'), '<script>export class Other {}</script>');
    assert.deepEqual(notifications, []);
    assert.match(errors[0], /destination already exists/);
});
