import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { GenericServer }, { pathToUri, uriToPath }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts',
]);

async function fixture(run) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-component-partial-'));
    const oldFiles = FilesManager.getInstance;
    const oldNotification = GenericServer.sendNotification;
    const files = new Map();
    const events = [];
    FilesManager.getInstance = () => ({
        getByUri: uri => files.get(uri),
        onClose: document => { files.delete(document.uri); },
        registerFile: document => { files.set(document.uri, file(document)); },
    });
    GenericServer.sendNotification = (...event) => events.push(event);
    try {
        await run({ root, files, events });
    } finally {
        FilesManager.getInstance = oldFiles;
        GenericServer.sendNotification = oldNotification;
        rmSync(root, { recursive: true, force: true });
    }
}

function file(document) {
    return {
        uri: document.uri, path: uriToPath(document.uri), documentUser: document,
        contentUser: document.getText(), contentInternal: document.getText(), versionUser: document.version,
    };
}

test('split creates empty HTML and CSS siblings when the component contains only a script', async () => {
    await fixture(async ({ root, files, events }) => {
        const source = join(root, 'OnlyScript.wc.avt');
        const uri = pathToUri(source);
        const content = '<script>export class OnlyScript {}</script>';
        writeFileSync(source, content);
        files.set(uri, file(TextDocument.create(uri, 'Aventus WebComponent', 7, content)));

        await Commands.allCommandes['aventus.component.split'].run(uri);

        const folder = join(root, 'OnlyScript');
        assert.equal(existsSync(source), false);
        assert.match(readFileSync(join(folder, 'OnlyScript.wcl.avt'), 'utf8'), /export class OnlyScript/);
        assert.equal(readFileSync(join(folder, 'OnlyScript.wcv.avt'), 'utf8'), '');
        assert.equal(readFileSync(join(folder, 'OnlyScript.wcs.avt'), 'utf8'), '');
        for (const extension of ['wcl', 'wcv', 'wcs']) {
            assert.equal(files.get(pathToUri(join(folder, `OnlyScript.${extension}.avt`))).versionUser, 8);
        }
        assert.deepEqual(events.map(([channel]) => channel), ['aventus/closefile', 'aventus/openfile']);
    });
});

test('merge tolerates missing style sibling and preserves the highest remaining version', async () => {
    await fixture(async ({ root, files, events }) => {
        const folder = join(root, 'Partial');
        mkdirSync(folder);
        for (const [extension, content, version] of [
            ['wcl', 'export class Partial {}', 9], ['wcv', '<p>Partial</p>', 3],
        ]) {
            const path = join(folder, `Partial.${extension}.avt`);
            const uri = pathToUri(path);
            writeFileSync(path, content);
            files.set(uri, file(TextDocument.create(uri, 'text', version, content)));
        }

        await Commands.allCommandes['aventus.component.merge'].run(pathToUri(join(folder, 'Partial.wcv.avt')));

        const merged = join(root, 'Partial.wc.avt');
        assert.equal(existsSync(folder), false);
        assert.match(readFileSync(merged, 'utf8'), /export class Partial/);
        assert.match(readFileSync(merged, 'utf8'), /<p>Partial<\/p>/);
        assert.equal(files.get(pathToUri(merged)).versionUser, 10);
        assert.deepEqual(events.map(([channel]) => channel), [
            'aventus/closefile', 'aventus/closefile', 'aventus/openfile',
        ]);
    });
});
