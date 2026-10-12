import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { InternalAventusFile }, { GenericServer }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'files/AventusFile.ts', 'GenericServer.ts',
    'language-services/ts/component/File.ts',
]);

test('view imports honor the explicit marker position and send an edit over the original document', async () => {
    for (const [command, method, insertion] of [
        ['aventus.wc.import.viewElement', 'getMissingVariablesInfo', 'private title!: HTMLElement;'],
        ['aventus.wc.import.viewMethod', 'getMissingMethodsInfo', 'private onClick() {}'],
    ]) {
        const uri = 'file:///D:/round109/Card.wcl.avt';
        const source = 'class Card {\n    /* marker */\n    existing() {}\n}';
        const position = source.indexOf('/* marker */');
        const file = new InternalAventusFile(TextDocument.create(uri, 'typescript', 1, source));
        const component = Object.create(AventusWebComponentLogicalFile.prototype);
        component[method] = () => ({ start: 0, text: insertion });
        const previousFiles = FilesManager.instance;
        const previousServer = GenericServer.instance;
        const sent = [];
        FilesManager.instance = {
            getByUri: requested => requested === uri ? file : undefined,
            getBuild: () => [{ tsFiles: { [uri]: component } }],
        };
        GenericServer.instance = {
            logLevel: 4,
            connection: { sendNotification: (...args) => sent.push(args) },
        };
        try {
            await Commands.allCommandes[command].run(uri, position);
            assert.match(file.contentUser, /^class Card \{/);
            assert.ok(file.contentUser.indexOf(insertion) > file.contentUser.indexOf('class Card {'));
            assert.ok(file.contentUser.indexOf(insertion) < file.contentUser.indexOf('existing() {}'));
            assert.match(file.contentUser, /existing\(\) \{\}[\s\S]*\}$/);
            assert.equal(sent.length, 1);
            assert.equal(sent[0][0], 'aventus/editFile');
            assert.equal(sent[0][1][0].uri, uri);
            const edit = sent[0][1][0].transformations[0][0];
            assert.equal(edit.newText, file.contentUser);
            assert.deepEqual(edit.range.start, { line: 0, character: 0 });
            assert.deepEqual(edit.range.end, TextDocument.create(uri, 'typescript', 1, source).positionAt(source.length));
        } finally {
            clearTimeout(file.delayValidate);
            FilesManager.instance = previousFiles;
            GenericServer.instance = previousServer;
        }
    }
});
