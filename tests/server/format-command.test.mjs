import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [formatModule, filesModule, fileModule, serverModule] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'files/AventusFile.ts', 'GenericServer.ts',
]);
const Format = formatModule.Commands.allCommandes['aventus.format'];
const { FilesManager } = filesModule;
const { InternalAventusFile } = fileModule;
const { GenericServer } = serverModule;

test('format command writes changed content and leaves unchanged files untouched', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-format-'));
    const changedPath = join(root, 'changed.wcl.avt');
    const untouchedPath = join(root, 'untouched.wcl.avt');
    writeFileSync(changedPath, 'old');
    writeFileSync(untouchedPath, 'same');
    const changedUri = pathToFileURL(changedPath).href;
    const untouchedUri = pathToFileURL(untouchedPath).href;
    const changed = new InternalAventusFile(TextDocument.create(changedUri, 'typescript', 1, 'old'));
    const untouched = new InternalAventusFile(TextDocument.create(untouchedUri, 'typescript', 1, 'same'));
    changed.onFormatting(async () => [{
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } },
        newText: 'new',
    }]);
    const previousFiles = FilesManager.instance;
    const previousServer = GenericServer.instance;
    const messages = [];
    let actionPromise;
    FilesManager.instance = {
        getUris: () => [changedUri, untouchedUri],
        getByUri: uri => ({ [changedUri]: changed, [untouchedUri]: untouched })[uri],
    };
    GenericServer.instance = {
        logLevel: 4,
        connection: { showLoadingMessage: (message, action) => {
            messages.push(message);
            actionPromise = action();
            return actionPromise;
        } },
    };
    try {
        await Format.run();
        await actionPromise;
        assert.deepEqual(messages, ['Formatting 2 files']);
        assert.equal(readFileSync(changedPath, 'utf8'), 'new');
        assert.equal(readFileSync(untouchedPath, 'utf8'), 'same');
        await Format.run(untouchedUri);
        await actionPromise;
        assert.equal(messages.at(-1), 'Formatting 1 files');
    } finally {
        clearTimeout(changed.delayValidate);
        clearTimeout(untouched.delayValidate);
        FilesManager.instance = previousFiles;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    }
});
