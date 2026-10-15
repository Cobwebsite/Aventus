import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { GenericServer }, { pathToUri, uriToPath }, { ProjectManager }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts', 'project/ProjectManager.ts',
]);

test('merge of a view-only component creates empty script and style without losing markup', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-view-only-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const oldFiles = FilesManager.getInstance;
    const oldProjects = ProjectManager.getInstance;
    const oldNotification = GenericServer.sendNotification;
    t.after(() => {
        FilesManager.getInstance = oldFiles;
        ProjectManager.getInstance = oldProjects;
        GenericServer.sendNotification = oldNotification;
    });

    const folder = join(root, 'Card');
    mkdirSync(folder);
    const sourcePath = join(folder, 'Card.wcv.avt');
    const sourceUri = pathToUri(sourcePath);
    const markup = '<section class="card">\n  <slot></slot>\n</section>';
    writeFileSync(sourcePath, markup);
    const document = TextDocument.create(sourceUri, 'html', 12, markup);
    const source = {
        uri: sourceUri, path: sourcePath, documentUser: document,
        contentUser: markup, contentInternal: markup, versionUser: 12,
    };
    const files = new Map([[sourceUri, source]]);
    const events = [];
    const renames = [];
    FilesManager.getInstance = () => ({
        getByUri: uri => files.get(uri),
        onClose: doc => files.delete(doc.uri),
        registerFile: doc => files.set(doc.uri, {
            uri: doc.uri, path: uriToPath(doc.uri), documentUser: doc,
            contentUser: doc.getText(), versionUser: doc.version,
        }),
    });
    ProjectManager.getInstance = () => ({ onRename: async changes => {
        renames.push(...changes);
        return {};
    } });
    GenericServer.sendNotification = (...event) => events.push(event);

    await Commands.allCommandes['aventus.component.merge'].run(sourceUri);

    const mergedPath = join(root, 'Card.wc.avt');
    const mergedUri = pathToUri(mergedPath);
    assert.equal(existsSync(sourcePath), false);
    assert.equal(existsSync(folder), false);
    assert.equal(existsSync(mergedPath), true);
    const merged = readFileSync(mergedPath, 'utf8');
    assert.match(merged, /<script>\s*<\/script>/);
    assert.match(merged, /<style>\s*<\/style>/);
    assert.match(merged, /<template>\s*<section class="card">\s*<slot><\/slot>\s*<\/section>\s*<\/template>/);
    assert.equal(files.get(mergedUri).versionUser, 13);
    assert.deepEqual(events.map(([channel]) => channel), ['aventus/closefile', 'aventus/openfile']);
    assert.deepEqual(renames, [{ oldUri: pathToUri(join(folder, 'Card.wcl.avt')), newUri: mergedUri }]);
});
