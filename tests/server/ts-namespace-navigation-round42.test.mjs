import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

function fixture() {
    const sources = {
        'file:///D:/test/round42-declaration.lib.avt': 'namespace Shared {\n/** Sends a message */\nexport function send(value: string): string { return value; }\n}',
        'file:///D:/test/round42-consumer.lib.avt': 'const message = Shared.send("hello");\nShared.sen',
    };
    const files = Object.fromEntries(Object.entries(sources).map(([uri, source]) => {
        const document = TextDocument.create(uri, 'typescript', 1, source);
        const file = { uri, documentInternal: document, documentUser: document, contentInternal: source, versionInternal: 1 };
        return [uri, { file, versionInternal: 1, contentForLanguageService: source }];
    }));
    const host = {
        getCompilationSettings: () => ({ noLib: true, target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true }),
        getScriptFileNames: () => Object.keys(sources),
        getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: () => '1',
        getScriptSnapshot: uri => sources[uri] === undefined ? undefined : ts.ScriptSnapshot.fromString(sources[uri]),
        getCurrentDirectory: () => '/', getDefaultLibFileName: () => '',
        fileExists: uri => uri in sources, readFile: uri => sources[uri], readDirectory: () => [],
    };
    const languageService = ts.createLanguageService(host);
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageService = languageService;
    service.languageServiceNamespace = languageService;
    service.filesLoaded = files;
    service.filesNeeded = Object.keys(files);
    service.i18nFiles = {};
    service.build = { tsFiles: files };
    const [declaration, consumer] = Object.values(files).map(entry => entry.file);
    return { service, declaration, consumer };
}

test('TypeScript namespace navigation crosses files for completion, hover and definition', async () => {
    const { service, declaration, consumer } = fixture();
    const source = consumer.documentInternal.getText();
    const completion = await service.doComplete(consumer, consumer.documentInternal.positionAt(source.length));
    const send = completion.items.find(item => item.label === 'send');
    assert.ok(send);
    assert.equal(consumer.documentInternal.getText(send.textEdit.range), 'sen');
    const call = consumer.documentInternal.positionAt(source.indexOf('send') + 1);
    const hover = await service.doHover(consumer, call);
    assert.match(hover?.contents?.value ?? '', /Sends a message/);
    const locations = await service.findDefinition(consumer, call);
    assert.equal(locations?.[0]?.uri, declaration.uri);
    assert.equal(declaration.documentInternal.getText(locations[0].range), 'send');
});

test('TypeScript references and rename include declaration and use in another file', async () => {
    const { service, declaration, consumer } = fixture();
    const source = consumer.documentInternal.getText();
    const call = consumer.documentInternal.positionAt(source.indexOf('send') + 1);
    const references = await service.onReferences(consumer, call);
    assert.deepEqual(new Set(references.map(location => location.uri)), new Set([declaration.uri, consumer.uri]));
    assert.ok(references.every(location => {
        const document = location.uri === declaration.uri ? declaration.documentInternal : consumer.documentInternal;
        return document.getText(location.range) === 'send';
    }));
    const edit = await service.onRename(consumer, call, 'dispatch');
    assert.deepEqual(new Set(Object.keys(edit?.changes ?? {})), new Set([declaration.uri, consumer.uri]));
    assert.ok(Object.entries(edit.changes).every(([uri, edits]) => edits.every(entry => {
        const document = uri === declaration.uri ? declaration.documentInternal : consumer.documentInternal;
        return entry.newText === 'dispatch' && document.getText(entry.range) === 'send';
    })));
});
