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

test('split retries after second output cannot be written', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-split-write-recovery-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = { files: FilesManager.getInstance, notify: GenericServer.sendNotification };
    t.after(() => {
        FilesManager.getInstance = previous.files;
        GenericServer.sendNotification = previous.notify;
    });

    const folder = join(root, 'Card');
    mkdirSync(folder);
    const stylePath = join(folder, 'Card.wcs.avt');
    const viewPath = join(folder, 'Card.wcv.avt');
    const logicPath = join(folder, 'Card.wcl.avt');
    mkdirSync(viewPath);
    const sourcePath = join(root, 'Card.wc.avt');
    const sourceUri = pathToUri(sourcePath);
    const source = '<script>export class Card {}</script><template><p>view</p></template><style>.card { color: red; }</style>';
    writeFileSync(sourcePath, source);
    const asFile = document => ({
        uri: document.uri, path: uriToPath(document.uri), documentUser: document,
        contentUser: document.getText(), contentInternal: document.getText(), versionUser: document.version,
    });
    const files = new Map([[sourceUri, asFile(TextDocument.create(sourceUri, 'Aventus WebComponent', 7, source))]]);
    const events = [];
    FilesManager.getInstance = () => ({
        getByUri: uri => files.get(uri),
        onClose: document => files.delete(document.uri),
        registerFile: document => files.set(document.uri, asFile(document)),
    });
    GenericServer.sendNotification = (...event) => events.push(event);

    const split = () => Commands.allCommandes['aventus.component.split'].run(sourceUri);
    await assert.rejects(split(), error => error?.code === 'EISDIR' || error?.code === 'EPERM');
    assert.equal(readFileSync(stylePath, 'utf8'), '.card { color: red; }');
    assert.equal(existsSync(logicPath), false);
    assert.equal(readFileSync(sourcePath, 'utf8'), source);
    assert.deepEqual([...files.keys()], [sourceUri]);
    assert.deepEqual(events, []);

    rmSync(viewPath, { recursive: true });
    await split();
    assert.equal(existsSync(sourcePath), false);
    assert.equal(readFileSync(viewPath, 'utf8'), '<p>view</p>');
    assert.equal(readFileSync(logicPath, 'utf8'), 'export class Card {}');
    assert.deepEqual([...files.keys()].map(uri => uri.split('/').at(-1)), [
        'Card.wcs.avt', 'Card.wcv.avt', 'Card.wcl.avt',
    ]);
    assert.deepEqual(events.map(([channel]) => channel), ['aventus/closefile', 'aventus/openfile']);
});
