import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { GenericServer }, { pathToUri, uriToPath }, { ProjectManager }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts', 'project/ProjectManager.ts',
]);

test('split and merge round trip preserves partial script/view content and version progression', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-component-roundtrip-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const originals = {
        files: FilesManager.getInstance,
        projects: ProjectManager.getInstance,
        notify: GenericServer.sendNotification,
    };
    t.after(() => {
        FilesManager.getInstance = originals.files;
        ProjectManager.getInstance = originals.projects;
        GenericServer.sendNotification = originals.notify;
    });

    const files = new Map();
    const events = [];
    const asFile = document => ({
        uri: document.uri,
        path: uriToPath(document.uri),
        documentUser: document,
        contentUser: document.getText(),
        contentInternal: document.getText(),
        versionUser: document.version,
    });
    FilesManager.getInstance = () => ({
        getByUri: uri => files.get(uri),
        onClose: document => files.delete(document.uri),
        registerFile: document => files.set(document.uri, asFile(document)),
    });
    ProjectManager.getInstance = () => ({ onRename: async () => ({}) });
    GenericServer.sendNotification = (channel, uri) => events.push([channel, uri]);

    const sourcePath = join(root, 'Card.wc.avt');
    const sourceUri = pathToUri(sourcePath);
    const source = '<script>export class Card {}</script><template><p>hello</p></template>';
    writeFileSync(sourcePath, source);
    files.set(sourceUri, asFile(TextDocument.create(sourceUri, 'Aventus WebComponent', 7, source)));

    await Commands.allCommandes['aventus.component.split'].run(sourceUri);
    const folder = join(root, 'Card');
    const logicPath = join(folder, 'Card.wcl.avt');
    const viewPath = join(folder, 'Card.wcv.avt');
    const stylePath = join(folder, 'Card.wcs.avt');
    assert.equal(readFileSync(logicPath, 'utf8'), 'export class Card {}');
    assert.equal(readFileSync(viewPath, 'utf8'), '<p>hello</p>');
    assert.equal(readFileSync(stylePath, 'utf8'), '');
    assert.equal(files.get(pathToUri(logicPath)).versionUser, 8);

    await Commands.allCommandes['aventus.component.merge'].run(pathToUri(viewPath));
    const merged = readFileSync(sourcePath, 'utf8');
    assert.match(merged, /<script>[\s\S]*export class Card/);
    assert.match(merged, /<template>[\s\S]*<p>hello<\/p>/);
    assert.match(merged, /<style>\s*<\/style>/);
    assert.equal(existsSync(folder), false);
    assert.equal(files.get(sourceUri).versionUser, 9);
    assert.deepEqual(events.map(([channel]) => channel), [
        'aventus/closefile', 'aventus/openfile',
        'aventus/closefile', 'aventus/closefile', 'aventus/closefile', 'aventus/openfile',
    ]);
});
