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

test('a script-only component splits and merges without losing its class or version', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-script-only-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = [FilesManager.getInstance, ProjectManager.getInstance, GenericServer.sendNotification];
    t.after(() => {
        [FilesManager.getInstance, ProjectManager.getInstance, GenericServer.sendNotification] = previous;
    });

    const files = new Map();
    const events = [];
    const renames = [];
    const stored = document => ({
        uri: document.uri, path: uriToPath(document.uri), documentUser: document,
        contentUser: document.getText(), contentInternal: document.getText(), versionUser: document.version,
    });
    FilesManager.getInstance = () => ({
        getByUri: uri => files.get(uri),
        onClose: document => files.delete(document.uri),
        registerFile: document => files.set(document.uri, stored(document)),
    });
    ProjectManager.getInstance = () => ({ onRename: async changes => {
        renames.push(...changes);
        return {};
    } });
    GenericServer.sendNotification = (...event) => events.push(event);

    const sourcePath = join(root, 'LogicOnly.wc.avt');
    const sourceUri = pathToUri(sourcePath);
    const script = 'export class LogicOnly { value = 7; }';
    const content = `<script>${script}</script>`;
    writeFileSync(sourcePath, content);
    files.set(sourceUri, stored(TextDocument.create(sourceUri, 'Aventus WebComponent', 8, content)));

    await Commands.allCommandes['aventus.component.split'].run(sourceUri);
    const folder = join(root, 'LogicOnly');
    const logicPath = join(folder, 'LogicOnly.wcl.avt');
    const logicUri = pathToUri(logicPath);
    assert.equal(existsSync(sourcePath), false);
    assert.equal(readFileSync(logicPath, 'utf8'), script);
    assert.equal(readFileSync(join(folder, 'LogicOnly.wcv.avt'), 'utf8'), '');
    assert.equal(readFileSync(join(folder, 'LogicOnly.wcs.avt'), 'utf8'), '');
    for (const extension of ['wcl', 'wcv', 'wcs']) {
        assert.equal(files.get(pathToUri(join(folder, `LogicOnly.${extension}.avt`))).versionUser, 9);
    }

    await Commands.allCommandes['aventus.component.merge'].run(logicUri);
    assert.equal(existsSync(folder), false);
    const merged = readFileSync(sourcePath, 'utf8');
    assert.match(merged, /<script>\s*export class LogicOnly \{ value = 7; \}\s*<\/script>/);
    assert.match(merged, /<template>\s*<\/template>/);
    assert.match(merged, /<style>\s*<\/style>/);
    assert.equal(files.get(sourceUri).versionUser, 10);
    assert.deepEqual(renames, [{ oldUri: logicUri, newUri: sourceUri }]);
    assert.deepEqual(events.map(([channel]) => channel), [
        'aventus/closefile', 'aventus/openfile',
        'aventus/closefile', 'aventus/closefile', 'aventus/closefile', 'aventus/openfile',
    ]);
});
