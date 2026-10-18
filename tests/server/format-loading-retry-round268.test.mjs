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

test('le formatage reprend après un échec du message de chargement avant son action', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-format-loading-retry-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'sample.wcl.avt');
    const uri = pathToFileURL(path).href;
    writeFileSync(path, 'old');
    const file = new InternalAventusFile(TextDocument.create(uri, 'typescript', 1, 'old'));
    const previousFiles = FilesManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        clearTimeout(file.delayValidate);
        FilesManager.instance = previousFiles;
        GenericServer.instance = previousServer;
    });
    let formattingCalls = 0;
    file.onFormatting(async () => {
        formattingCalls++;
        return [{
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } },
            newText: 'new',
        }];
    });
    FilesManager.instance = { getUris: () => [uri], getByUri: () => file };
    let loadingCalls = 0;
    GenericServer.instance = { connection: {
        showLoadingMessage: async (_message, action) => {
            if (++loadingCalls === 1) throw new Error('loading unavailable');
            return action();
        },
    } };
    const format = () => Commands.allCommandes['aventus.format'].run(uri);

    await assert.rejects(format(), /loading unavailable/);
    assert.equal(formattingCalls, 0);
    assert.equal(file.contentUser, 'old');
    assert.equal(readFileSync(path, 'utf8'), 'old');

    await format();
    assert.equal(loadingCalls, 2);
    assert.equal(formattingCalls, 1);
    assert.equal(file.contentUser, 'new');
    assert.equal(readFileSync(path, 'utf8'), 'new');
});
