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

test('merge restores references and sources after a reference edit fails', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-merge-reference-error-'));
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
    const firstRefPath = join(root, 'first.ts');
    const secondRefPath = join(root, 'second.ts');
    const destination = join(root, 'Card.wc.avt');
    const files = new Map();
    for (const [path, content, version] of [
        [logicPath, 'export class Card {}', 2],
        [viewPath, '<p>card</p>', 4],
        [firstRefPath, 'old-first', 1],
        [secondRefPath, 'old-second', 1],
    ]) {
        writeFileSync(path, content);
        const uri = pathToUri(path);
        const document = TextDocument.create(uri, 'text', version, content);
        files.set(uri, {
            uri, path: uriToPath(uri), documentUser: document,
            contentUser: content, versionUser: version,
            async applyTextEdits(edits) {
                if (path === secondRefPath) throw new Error('reference edit unavailable');
                this.contentUser = TextDocument.applyEdits(this.documentUser, edits);
            },
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
    let renameCalls = 0;
    ProjectManager.getInstance = () => ({ onRename: async () => {
        renameCalls++;
        if (renameCalls > 1) return {};
        return {
            [pathToUri(firstRefPath)]: [{
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 9 } },
                newText: 'new-first',
            }],
            [pathToUri(secondRefPath)]: [{
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
                newText: 'new-second',
            }],
        };
    } });

    const merge = () => Commands.allCommandes['aventus.component.merge'].run(pathToUri(logicPath));
    await assert.rejects(merge(), /reference edit unavailable/);
    assert.equal(readFileSync(firstRefPath, 'utf8'), 'old-first');
    assert.equal(files.get(pathToUri(firstRefPath)).contentUser, 'old-first');
    assert.equal(readFileSync(secondRefPath, 'utf8'), 'old-second');
    assert.equal(readFileSync(logicPath, 'utf8'), 'export class Card {}');
    assert.equal(readFileSync(viewPath, 'utf8'), '<p>card</p>');
    assert.equal(existsSync(destination), false);
    assert.deepEqual(notifications, []);

    await merge();
    assert.equal(renameCalls, 2);
    assert.equal(existsSync(folder), false);
    assert.match(readFileSync(destination, 'utf8'), /export class Card/);
    assert.match(readFileSync(destination, 'utf8'), /<p>card<\/p>/);
    assert.equal(readFileSync(firstRefPath, 'utf8'), 'old-first');
    assert.equal(readFileSync(secondRefPath, 'utf8'), 'old-second');
    assert.deepEqual(notifications.map(([channel]) => channel), [
        'aventus/closefile', 'aventus/closefile', 'aventus/openfile',
    ]);
});
