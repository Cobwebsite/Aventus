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

test('merge leaves sources untouched when project rename fails and succeeds on retry', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-merge-rename-retry-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        files: FilesManager.getInstance,
        projects: ProjectManager.getInstance,
        notify: GenericServer.sendNotification,
    };
    t.after(() => {
        FilesManager.getInstance = previous.files;
        ProjectManager.getInstance = previous.projects;
        GenericServer.sendNotification = previous.notify;
    });

    const folder = join(root, 'Card');
    mkdirSync(folder);
    const logicPath = join(folder, 'Card.wcl.avt');
    const viewPath = join(folder, 'Card.wcv.avt');
    const destination = join(root, 'Card.wc.avt');
    const sources = [
        [logicPath, 'export class Card {}', 3],
        [viewPath, '<p>card</p>', 7],
    ];
    const files = new Map();
    for (const [path, content, version] of sources) {
        writeFileSync(path, content);
        const uri = pathToUri(path);
        const document = TextDocument.create(uri, 'text', version, content);
        files.set(uri, {
            uri, path: uriToPath(uri), documentUser: document,
            contentUser: content, versionUser: version,
        });
    }
    const notifications = [];
    FilesManager.getInstance = () => ({
        getByUri: uri => files.get(uri),
        onClose: document => files.delete(document.uri),
        registerFile: document => files.set(document.uri, {
            uri: document.uri, path: uriToPath(document.uri), documentUser: document,
            contentUser: document.getText(), versionUser: document.version,
        }),
    });
    GenericServer.sendNotification = (...event) => notifications.push(event);
    let attempts = 0;
    const renameChanges = [];
    ProjectManager.getInstance = () => ({ onRename: async changes => {
        attempts++;
        renameChanges.push(changes);
        if (attempts === 1) throw new Error('rename unavailable');
        return {};
    } });

    const merge = () => Commands.allCommandes['aventus.component.merge'].run(pathToUri(viewPath));
    await assert.rejects(merge(), /rename unavailable/);
    assert.equal(existsSync(destination), false);
    assert.equal(readFileSync(logicPath, 'utf8'), sources[0][1]);
    assert.equal(readFileSync(viewPath, 'utf8'), sources[1][1]);
    assert.deepEqual([...files.keys()], sources.map(([path]) => pathToUri(path)));
    assert.deepEqual(notifications, []);

    await merge();
    assert.equal(attempts, 2);
    assert.deepEqual(renameChanges, [
        [{ oldUri: pathToUri(logicPath), newUri: pathToUri(destination) }],
        [{ oldUri: pathToUri(logicPath), newUri: pathToUri(destination) }],
    ]);
    assert.equal(existsSync(folder), false);
    assert.equal(existsSync(logicPath), false);
    assert.equal(existsSync(viewPath), false);
    assert.match(readFileSync(destination, 'utf8'), /export class Card/);
    assert.match(readFileSync(destination, 'utf8'), /<p>card<\/p>/);
    assert.equal(files.get(pathToUri(destination)).versionUser, 8);
    assert.deepEqual(notifications.map(([channel]) => channel), [
        'aventus/closefile', 'aventus/closefile', 'aventus/openfile',
    ]);
});
