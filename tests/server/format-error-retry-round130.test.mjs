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

test('format command continues after one formatter fails and retries that file on the next run', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-format-retry-'));
    const paths = ['first.wcl.avt', 'second.wcl.avt'].map(name => join(root, name));
    const uris = paths.map(path => pathToFileURL(path).href);
    paths.forEach(path => writeFileSync(path, 'old'));
    const files = uris.map(uri => new InternalAventusFile(TextDocument.create(uri, 'typescript', 1, 'old')));
    const previousFiles = FilesManager.instance;
    const previousServer = GenericServer.instance;
    const previousError = console.error;
    t.after(() => {
        files.forEach(file => clearTimeout(file.delayValidate));
        FilesManager.instance = previousFiles;
        GenericServer.instance = previousServer;
        console.error = previousError;
        rmSync(root, { recursive: true, force: true });
    });

    let failFirst = true;
    const seen = [];
    files[0].onFormatting(async () => {
        seen.push('first');
        if (failFirst) throw new Error('formatter unavailable');
        return [{ range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } }, newText: 'first' }];
    });
    files[1].onFormatting(async () => {
        seen.push('second');
        return [{ range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } }, newText: 'second' }];
    });
    FilesManager.instance = {
        getUris: () => uris,
        getByUri: uri => files[uris.indexOf(uri)],
    };
    GenericServer.instance = { connection: { showLoadingMessage: async (_message, action) => action() } };
    const errors = [];
    console.error = error => errors.push(error);

    await Commands.allCommandes['aventus.format'].run();
    assert.deepEqual(seen, ['first', 'second']);
    assert.equal(errors.length, 1);
    assert.match(errors[0].message, /formatter unavailable/);
    assert.deepEqual(paths.map(path => readFileSync(path, 'utf8')), ['old', 'second']);

    failFirst = false;
    await Commands.allCommandes['aventus.format'].run(uris[0]);
    assert.deepEqual(seen, ['first', 'second', 'first']);
    assert.deepEqual(paths.map(path => readFileSync(path, 'utf8')), ['first', 'second']);
});
