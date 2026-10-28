import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { InternalAventusFile }, { GenericServer }] =
    await loadServerModules([
        'cmds/index.ts', 'files/FilesManager.ts', 'files/AventusFile.ts', 'GenericServer.ts',
    ]);

test('une édition concurrente pendant le formatage conserve le document récent et signale le conflit', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-format-stale-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'stale.wcl.avt');
    const uri = pathToFileURL(path).href;
    writeFileSync(path, 'abc def');
    const file = new InternalAventusFile(TextDocument.create(uri, 'typescript', 1, 'abc def'));
    const previousFiles = FilesManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        clearTimeout(file.delayValidate);
        FilesManager.instance = previousFiles;
        GenericServer.instance = previousServer;
    });
    let releaseFormatting;
    let formatterEntered;
    const entered = new Promise(resolve => { formatterEntered = resolve; });
    file.onFormatting(async () => {
        formatterEntered();
        return new Promise(resolve => { releaseFormatting = resolve; });
    });
    FilesManager.instance = { getUris: () => [uri], getByUri: () => file };
    const errors = [];
    GenericServer.instance = { connection: {
        showLoadingMessage: async (_message, action) => action(),
        showErrorMessage: message => errors.push(message),
    } };

    const pending = Commands.allCommandes['aventus.format'].run(uri);
    await entered;
    assert.equal(typeof releaseFormatting, 'function');
    await file.triggerContentChange(TextDocument.create(uri, 'typescript', 2, 'new abc def'));
    releaseFormatting([{
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } },
        newText: 'ABC',
    }]);
    await pending;

    assert.equal(file.contentUser, 'new abc def');
    assert.equal(readFileSync(path, 'utf8'), 'abc def');
    assert.equal(errors.length, 1);
    assert.match(errors[0], /Files changed during formatting; format them again/);
    assert.match(errors[0], /stale\.wcl\.avt/);
});
