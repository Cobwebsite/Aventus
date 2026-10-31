import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { InternalAventusFile }, { GenericServer }] =
    await loadServerModules([
        'cmds/index.ts', 'files/FilesManager.ts', 'files/AventusFile.ts', 'GenericServer.ts',
    ]);

test('un échec d écriture après formatage laisse la mémoire modifiée et le nouvel essai ne réécrit pas', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-format-write-retry-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'sample.wcl.avt');
    const uri = pathToFileURL(path).href;
    writeFileSync(path, 'before');
    const file = new InternalAventusFile(TextDocument.create(uri, 'typescript', 1, 'before'));
    const previousFiles = FilesManager.instance;
    const previousServer = GenericServer.instance;
    const previousError = console.error;
    t.after(() => {
        clearTimeout(file.delayValidate);
        FilesManager.instance = previousFiles;
        GenericServer.instance = previousServer;
        console.error = previousError;
    });
    let calls = 0;
    file.onFormatting(async () => {
        calls++;
        if (calls === 1) {
            rmSync(path);
            mkdirSync(path);
            return [{
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 6 } },
                newText: 'after',
            }];
        }
        return [];
    });
    FilesManager.instance = { getUris: () => [uri], getByUri: () => file };
    const messages = [];
    const errors = [];
    console.error = error => errors.push(error);
    GenericServer.instance = { connection: {
        showLoadingMessage: async (_message, action) => action(),
        showErrorMessage: message => messages.push(message),
    } };

    const format = () => Commands.allCommandes['aventus.format'].run(uri);
    await format();
    assert.equal(file.contentUser, 'after');
    assert.equal(errors.length, 1);
    assert.match(messages[0], /sample\.wcl\.avt/);
    rmSync(path, { recursive: true });
    writeFileSync(path, 'before');

    await format();
    assert.equal(calls, 2);
    assert.equal(file.contentUser, 'after');
    assert.equal(readFileSync(path, 'utf8'), 'before');
    assert.equal(messages.length, 1);
});

test('un lot de formatage poursuit les fichiers suivants après un échec d écriture', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-format-write-batch-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const paths = ['failed.wcl.avt', 'saved.wcl.avt'].map(name => join(root, name));
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
    });
    const seen = [];
    files[0].onFormatting(async () => {
        seen.push('failed');
        rmSync(paths[0]);
        mkdirSync(paths[0]);
        return [{ range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } }, newText: 'first' }];
    });
    files[1].onFormatting(async () => {
        seen.push('saved');
        return [{ range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } }, newText: 'second' }];
    });
    FilesManager.instance = { getUris: () => uris, getByUri: uri => files[uris.indexOf(uri)] };
    const messages = [];
    const errors = [];
    console.error = error => errors.push(error);
    GenericServer.instance = { connection: {
        showLoadingMessage: async (_message, action) => action(),
        showErrorMessage: message => messages.push(message),
    } };

    await Commands.allCommandes['aventus.format'].run();
    assert.deepEqual(seen, ['failed', 'saved']);
    assert.deepEqual(files.map(file => file.contentUser), ['first', 'second']);
    assert.equal(readFileSync(paths[1], 'utf8'), 'second');
    assert.equal(errors.length, 1);
    assert.equal(messages.length, 1);
    assert.match(messages[0], /failed\.wcl\.avt/);
    assert.doesNotMatch(messages[0], /saved\.wcl\.avt/);
});
