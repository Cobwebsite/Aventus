import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { InternalAventusFile }, { GenericServer }] =
    await loadServerModules([
        'cmds/index.ts', 'files/FilesManager.ts', 'files/AventusFile.ts', 'GenericServer.ts',
    ]);

test('format command applies disjoint edits from the end and persists each successive revision', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-format-edits-'));
    const path = join(root, 'component.wcl.avt');
    const uri = pathToFileURL(path).href;
    writeFileSync(path, 'one two three');
    const file = new InternalAventusFile(TextDocument.create(uri, 'typescript', 1, 'one two three'));
    const previousFiles = FilesManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        clearTimeout(file.delayValidate);
        FilesManager.instance = previousFiles;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    });

    const formatted = [];
    file.onFormatting(async () => {
        formatted.push(file.contentUser);
        if (file.contentUser === 'one two three') {
            return [
                { range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } }, newText: 'ONE!' },
                { range: { start: { line: 0, character: 8 }, end: { line: 0, character: 13 } }, newText: 'THREE' },
            ];
        }
        return [{ range: { start: { line: 0, character: 5 }, end: { line: 0, character: 8 } }, newText: 'TWO' }];
    });
    FilesManager.instance = { getUris: () => [uri], getByUri: () => file };
    GenericServer.instance = { connection: { showLoadingMessage: async (_message, action) => action() } };

    await Commands.allCommandes['aventus.format'].run(uri);
    assert.equal(file.contentUser, 'ONE! two THREE');
    assert.equal(readFileSync(path, 'utf8'), 'ONE! two THREE');

    await Commands.allCommandes['aventus.format'].run(uri);
    assert.deepEqual(formatted, ['one two three', 'ONE! two THREE']);
    assert.equal(file.contentUser, 'ONE! TWO THREE');
    assert.equal(readFileSync(path, 'utf8'), 'ONE! TWO THREE');
});
