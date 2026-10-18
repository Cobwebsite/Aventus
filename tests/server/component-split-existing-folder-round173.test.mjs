import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { GenericServer }, { pathToUri, uriToPath }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts',
]);

test('split into an existing component folder preserves matching sibling and source', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-split-existing-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const oldFiles = FilesManager.getInstance;
    const oldNotify = GenericServer.sendNotification;
    const oldError = GenericServer.showErrorMessage;
    t.after(() => {
        FilesManager.getInstance = oldFiles;
        GenericServer.sendNotification = oldNotify;
        GenericServer.showErrorMessage = oldError;
    });

    const folder = join(root, 'Card');
    mkdirSync(folder);
    const oldStyle = join(folder, 'Card.wcs.avt');
    const foreign = join(folder, 'notes.txt');
    writeFileSync(oldStyle, '.old { color: red; }');
    writeFileSync(foreign, 'keep me');
    const sourcePath = join(root, 'Card.wc.avt');
    const sourceUri = pathToUri(sourcePath);
    const source = '<script>export class Card {}</script><template><p>new</p></template><style>.new { color: blue; }</style>';
    writeFileSync(sourcePath, source);
    const files = new Map();
    const events = [];
    const errors = [];
    const asFile = document => ({
        uri: document.uri, path: uriToPath(document.uri), documentUser: document,
        contentUser: document.getText(), contentInternal: document.getText(), versionUser: document.version,
    });
    files.set(sourceUri, asFile(TextDocument.create(sourceUri, 'Aventus WebComponent', 3, source)));
    FilesManager.getInstance = () => ({
        getByUri: uri => files.get(uri),
        onClose: document => files.delete(document.uri),
        registerFile: document => files.set(document.uri, asFile(document)),
    });
    GenericServer.sendNotification = (...event) => events.push(event);
    GenericServer.showErrorMessage = message => errors.push(message);

    await Commands.allCommandes['aventus.component.split'].run(sourceUri);

    assert.equal(readFileSync(sourcePath, 'utf8'), source);
    assert.equal(readFileSync(oldStyle, 'utf8'), '.old { color: red; }');
    assert.equal(existsSync(join(folder, 'Card.wcl.avt')), false);
    assert.equal(existsSync(join(folder, 'Card.wcv.avt')), false);
    assert.equal(readFileSync(foreign, 'utf8'), 'keep me');
    assert.deepEqual([...files.keys()], [sourceUri]);
    assert.deepEqual(events, []);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /destination already exists: true/);
});
