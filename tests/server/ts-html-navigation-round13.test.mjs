import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { AventusHTMLLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts',
    'language-services/html/LanguageService.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

let id = 0;
function tsFixture(sources) {
    const prefix = `file:///D:/test/round13-${++id}-`;
    const entries = Object.fromEntries(Object.entries(sources).map(([name, source]) => {
        const uri = `${prefix}${name}.lib.avt`;
        const document = TextDocument.create(uri, 'typescript', 1, source);
        return [name, { uri, source, document, file: { uri, documentInternal: document, documentUser: document, contentInternal: source, versionInternal: 1 } }];
    }));
    const byUri = Object.fromEntries(Object.values(entries).map(entry => [entry.uri, entry]));
    const host = {
        getCompilationSettings: () => ({ noLib: true, target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true }),
        getScriptFileNames: () => Object.keys(byUri),
        getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: () => '1',
        getScriptSnapshot: uri => byUri[uri] ? ts.ScriptSnapshot.fromString(byUri[uri].source) : undefined,
        getCurrentDirectory: () => '/',
        getDefaultLibFileName: () => '',
        fileExists: uri => !!byUri[uri],
        readFile: uri => byUri[uri]?.source,
        readDirectory: () => [],
    };
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageService = ts.createLanguageService(host);
    service.languageServiceNamespace = service.languageService;
    service.filesLoaded = Object.fromEntries(Object.values(entries).map(entry => [entry.uri, { file: entry.file }]));
    service.filesNeeded = Object.keys(byUri);
    service.i18nFiles = {};
    service.build = { tsFiles: service.filesLoaded };
    return { service, entries };
}

test('TypeScript references include declaration and uses in two loaded files', async () => {
    const { service, entries } = tsFixture({ declaration: 'class Card { submit() {} }', usage: 'const card = new Card(); card.submit();' });
    const { declaration, usage } = entries;
    const position = usage.document.positionAt(usage.source.indexOf('submit') + 2);
    const references = await service.onReferences(usage.file, position);
    assert.deepEqual(new Set(references.map(ref => ref.uri)), new Set([declaration.uri, usage.uri]));
    assert.ok(references.some(ref => declaration.document.getText(ref.range) === 'submit'));
    assert.ok(references.some(ref => usage.document.getText(ref.range) === 'submit'));
});

test('TypeScript rename edits declaration and uses across loaded files', async () => {
    const { service, entries } = tsFixture({ declaration: 'class Card { submit() {} }', usage: 'const card = new Card(); card.submit();' });
    const { declaration, usage } = entries;
    const position = usage.document.positionAt(usage.source.indexOf('submit') + 2);
    const result = await service.onRename(usage.file, position, 'send');
    assert.deepEqual(Object.keys(result.changes).sort(), [declaration.uri, usage.uri].sort());
    assert.deepEqual(result.changes[declaration.uri].map(edit => declaration.document.getText(edit.range)), ['submit']);
    assert.deepEqual(result.changes[usage.uri].map(edit => usage.document.getText(edit.range)), ['submit']);
    assert.ok(Object.values(result.changes).flat().every(edit => edit.newText === 'send'));
});

test('TypeScript rename refuses a non-renamable position', async () => {
    const { service, entries } = tsFixture({ only: 'const value = 1;' });
    const { only } = entries;
    assert.equal(await service.onRename(only.file, only.document.positionAt(only.source.indexOf('=') + 1), 'other'), null);
});

function htmlFixture(source) {
    const uri = `file:///D:/test/round13-${++id}.html.avt`;
    const document = TextDocument.create(uri, 'Aventus HTML', 1, source);
    const service = Object.create(AventusHTMLLanguageService.prototype);
    service.extenalDocumentation = {};
    service.internalDocumentation = {};
    service.internalDocumentationReverse = {};
    service.internalTagUri = {};
    service._allowRebuildDefinition = true;
    service.rebuildDefinition();
    service.languageService = getLanguageService({ customDataProviders: [service.defaultProvider()] });
    const file = { file: { uri, documentUser: document }, fileParsed: null };
    return { service, file, document };
}

test('HTML formatting returns an edit that indents nested elements', async () => {
    const source = '<div>\n<span>Text</span>\n</div>';
    const { service, document } = htmlFixture(source);
    const edits = await service.format(document, null, { insertSpaces: true, tabSize: 2 });
    assert.ok(edits.length > 0);
    assert.match(edits.map(edit => edit.newText).join(''), /\n\s+<span>/);
});

test('HTML completion keeps standard tags available with malformed open markup', async () => {
    const { service, file, document } = htmlFixture('<div><sp');
    const completion = await service.doComplete(file, document.positionAt(document.getText().length));
    assert.ok(completion.items.some(item => item.label === 'span'));
    assert.deepEqual(await service.doValidation(file.file), []);
});
