import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { GenericServer }, { pathToUri, uriToPath }, { ProjectManager }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts', 'project/ProjectManager.ts',
]);

test('merge applies project reference edits to open files before replacing the component', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-merge-references-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const prior = [FilesManager.getInstance, ProjectManager.getInstance, GenericServer.sendNotification];
    t.after(() => {
        [FilesManager.getInstance, ProjectManager.getInstance, GenericServer.sendNotification] = prior;
    });
    const folder = join(root, 'Card');
    mkdirSync(folder);
    const logicPath = join(folder, 'Card.wcl.avt');
    const viewPath = join(folder, 'Card.wcv.avt');
    const stylePath = join(folder, 'Card.wcs.avt');
    const refPath = join(root, 'consumer.wcl.avt');
    const mergedPath = join(root, 'Card.wc.avt');
    const refs = 'import { Card } from "./Card/Card.wcl.avt";';
    const files = new Map();
    const events = [];
    for (const [path, content, version] of [
        [logicPath, 'export class Card {}', 2],
        [viewPath, '<p>card</p>', 5],
        [stylePath, 'p { color: red; }', 3],
        [refPath, refs, 4],
    ]) {
        const uri = pathToUri(path);
        writeFileSync(path, content);
        const document = TextDocument.create(uri, 'text', version, content);
        files.set(uri, {
            uri, path: uriToPath(uri), documentUser: document, contentUser: content, versionUser: version,
            async applyTextEdits(edits) {
                this.contentUser = TextDocument.applyEdits(this.documentUser, edits);
            },
        });
    }
    FilesManager.getInstance = () => ({
        getByUri: uri => files.get(uri),
        onClose: document => files.delete(document.uri),
        registerFile: document => files.set(document.uri, {
            uri: document.uri, path: uriToPath(document.uri), documentUser: document,
            contentUser: document.getText(), versionUser: document.version,
        }),
    });
    const renames = [];
    ProjectManager.getInstance = () => ({ onRename: async changes => {
        renames.push(...changes);
        return { [pathToUri(refPath)]: [{
            range: { start: { line: 0, character: 22 }, end: { line: 0, character: 41 } },
            newText: './Card.wc.avt',
        }] };
    } });
    GenericServer.sendNotification = (...args) => events.push(args);

    await Commands.allCommandes['aventus.component.merge'].run(pathToUri(stylePath));

    assert.deepEqual(renames, [{ oldUri: pathToUri(logicPath), newUri: pathToUri(mergedPath) }]);
    assert.equal(readFileSync(refPath, 'utf8'), 'import { Card } from "./Card.wc.avt";');
    assert.match(readFileSync(mergedPath, 'utf8'), /export class Card/);
    assert.match(readFileSync(mergedPath, 'utf8'), /<p>card<\/p>/);
    assert.match(readFileSync(mergedPath, 'utf8'), /p \{ color: red; \}/);
    assert.equal(files.get(pathToUri(mergedPath)).versionUser, 6);
    assert.equal(existsSync(folder), false);
    assert.deepEqual(events.map(([channel]) => channel), [
        'aventus/closefile', 'aventus/closefile', 'aventus/closefile', 'aventus/openfile',
    ]);
});
