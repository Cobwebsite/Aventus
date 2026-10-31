import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [commands, files, fileModule, server] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts',
    'files/AventusFile.ts', 'GenericServer.ts',
]);
const AddConfigSection = commands.Commands.allCommandes['aventus.addConfigSection'];
const Format = commands.Commands.allCommandes['aventus.format'];
const { FilesManager } = files;
const { InternalAventusFile } = fileModule;
const { GenericServer } = server;

test('add config section recovers after JSON correction and preserves existing sections', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.config-recovery-round53-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const configPath = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(configPath).href;
    const invalid = '{"build": [}';
    writeFileSync(configPath, invalid);
    const previousServer = GenericServer.instance;
    const previousError = console.error;
    const notifications = [];
    const errors = [];
    console.error = error => errors.push(error);
    GenericServer.instance = { logLevel: 4, connection: {
        Select: async () => ({ label: 'Build' }),
        Input: async () => 'Later Build',
        sendNotification: (...args) => notifications.push(args),
    } };
    try {
        await AddConfigSection.run(uri);
        assert.equal(readFileSync(configPath, 'utf8'), invalid);
        assert.equal(errors.length, 1);
        assert.deepEqual(notifications, []);

        const originalBuild = { name: 'Original', src: ['src'], compile: [{ output: './original.js' }] };
        const originalStatic = { name: 'Assets', input: './assets', output: './dist/assets' };
        writeFileSync(configPath, JSON.stringify({ module: 'Demo', build: [originalBuild], static: [originalStatic] }));
        await AddConfigSection.run(uri);
        const result = JSON.parse(readFileSync(configPath, 'utf8'));
        assert.deepEqual(result.build, [originalBuild, {
            name: 'Later_Build', src: [], compile: [{ output: './dist/Later-Build.js' }],
        }]);
        assert.deepEqual(result.static, [originalStatic]);
        assert.equal(notifications.length, 1);
    } finally {
        GenericServer.instance = previousServer;
        console.error = previousError;
    }
});

test('format continues with later files after one formatter rejects', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.format-recovery-round53-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const badPath = join(root, 'bad.wcl.avt');
    const goodPath = join(root, 'good.wcl.avt');
    writeFileSync(badPath, 'bad');
    writeFileSync(goodPath, 'old');
    const badUri = pathToFileURL(badPath).href;
    const goodUri = pathToFileURL(goodPath).href;
    const bad = new InternalAventusFile(TextDocument.create(badUri, 'typescript', 1, 'bad'));
    const good = new InternalAventusFile(TextDocument.create(goodUri, 'typescript', 1, 'old'));
    bad.onFormatting(async () => { throw new Error('formatter failed'); });
    good.onFormatting(async () => [{
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } },
        newText: 'new',
    }]);
    const previousFiles = FilesManager.instance;
    const previousServer = GenericServer.instance;
    const previousError = console.error;
    const errors = [];
    const messages = [];
    console.error = error => errors.push(error);
    FilesManager.instance = {
        getUris: () => [badUri, goodUri],
        getByUri: uri => ({ [badUri]: bad, [goodUri]: good })[uri],
    };
    GenericServer.instance = { logLevel: 4, connection: {
        showLoadingMessage: async (_message, action) => action(),
        showErrorMessage: message => messages.push(message),
    } };
    try {
        await Format.run();
        assert.equal(readFileSync(badPath, 'utf8'), 'bad');
        assert.equal(readFileSync(goodPath, 'utf8'), 'new');
        assert.equal(errors.length, 1);
        assert.match(errors[0].message, /formatter failed/);
        assert.equal(messages.length, 1);
        assert.match(messages[0], /Formatting failed for 1 file/);
        assert.match(messages[0], /bad\.wcl\.avt/);
    } finally {
        clearTimeout(bad.delayValidate);
        clearTimeout(good.delayValidate);
        FilesManager.instance = previousFiles;
        GenericServer.instance = previousServer;
        console.error = previousError;
    }
});
