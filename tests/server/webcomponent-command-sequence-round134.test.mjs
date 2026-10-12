import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { InternalAventusFile }, { GenericServer }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'files/AventusFile.ts', 'GenericServer.ts',
    'language-services/ts/component/File.ts',
]);

test('attribute, property and watch commands compose on the same component without losing earlier members', async () => {
    const uri = 'file:///D:/round134/Card.wcl.avt';
    const original = '@TagName("demo-card")\nexport class Card {\n    _\n    _\n    _\n}\n';
    const file = new InternalAventusFile(TextDocument.create(uri, 'typescript', 1, original));
    const component = Object.create(AventusWebComponentLogicalFile.prototype);
    component.getComponentName = () => 'Card';
    const inputs = ['count', 'caption', 'status', 'Promise<number>'];
    const selections = [
        { label: 'Number', detail: 'number' },
        { label: 'String', detail: 'string' }, { label: 'Yes' },
        { label: 'No' },
    ];
    const edits = [];
    const previousFiles = FilesManager.instance;
    const previousServer = GenericServer.instance;
    FilesManager.instance = {
        getByUri: candidate => candidate === uri ? file : undefined,
        getBuild: () => [{ tsFiles: { [uri]: component }, isCoreBuild: false }],
    };
    GenericServer.instance = {
        logLevel: 4,
        connection: {
            Input: async () => inputs.shift(),
            Select: async () => selections.shift(),
            sendNotification: (...args) => edits.push(args),
        },
    };
    try {
        for (const [command, prefill] of [
            ['aventus.wc.create.attribute', undefined],
            ['aventus.wc.create.property', 'caption'],
            ['aventus.wc.create.watch', 'status'],
        ]) {
            const previous = file.contentUser;
            const marker = previous.indexOf('_');
            assert.ok(marker >= 0);
            await Commands.allCommandes[command].run(uri, marker, prefill);
            assert.ok(edits.length > 0, `${command}: ${JSON.stringify({ inputs, selections, content: file.contentUser })}`);
            const [method, params] = edits.at(-1);
            assert.equal(method, 'aventus/editFile');
            assert.equal(params[0].uri, uri);
            assert.equal(params[0].transformations[0][0].newText, file.contentUser);
            assert.deepEqual(params[0].transformations[0][0].range.end, TextDocument.create(uri, 'typescript', 1, previous).positionAt(previous.length));
        }
        assert.equal(edits.length, 3);
        assert.deepEqual(inputs, []);
        assert.deepEqual(selections, []);
        assert.match(file.contentUser, /@TagName\("demo-card"\)/);
        assert.match(file.contentUser, /@Attribute\(\)[\s\S]*?public count!:number;/);
        assert.match(file.contentUser, /@Property\(\(target: Card\) =>[\s\S]*?public caption\?:string;/);
        assert.match(file.contentUser, /@Watch\(\)[\s\S]*?public status\?:Promise<number>;/);
        assert.equal((file.contentUser.match(/@Attribute\(/g) ?? []).length, 1);
        assert.equal((file.contentUser.match(/@Property\(/g) ?? []).length, 1);
        assert.equal((file.contentUser.match(/@Watch\(/g) ?? []).length, 1);
        assert.doesNotMatch(file.contentUser, /\b_\b/);
    } finally {
        clearTimeout(file.delayValidate);
        FilesManager.instance = previousFiles;
        GenericServer.instance = previousServer;
    }
});
