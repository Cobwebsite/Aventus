import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

let sequence = 0;
function fixture(source) {
    const uri = `file:///D:/test/ts-lsp-round7-${++sequence}.lib.avt`;
    const document = TextDocument.create(uri, 'typescript', 1, source);
    const file = { uri, documentInternal: document, documentUser: document, contentInternal: source, versionInternal: 1 };
    const tsFile = { file, versionInternal: 1, contentForLanguageService: source };
    const host = {
        getCompilationSettings: () => ({ noLib: true, target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true }),
        getScriptFileNames: () => [uri],
        getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: () => '1',
        getScriptSnapshot: name => name === uri ? ts.ScriptSnapshot.fromString(source) : undefined,
        getCurrentDirectory: () => '/',
        getDefaultLibFileName: () => '',
        fileExists: name => name === uri,
        readFile: name => name === uri ? source : undefined,
        readDirectory: () => [],
    };
    const languageService = ts.createLanguageService(host);
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageService = languageService;
    service.languageServiceNamespace = languageService;
    service.filesLoaded = { [uri]: tsFile };
    service.filesNeeded = [uri];
    service.i18nFiles = {};
    service.build = { tsFiles: { [uri]: tsFile } };
    return { service, file, document, uri };
}

test('TypeScript completion offers local members with replacement range and resolve data', async () => {
    const source = 'class Card { public submit(): void {} }\nconst card = new Card();\ncard.sub';
    const { service, file, document, uri } = fixture(source);
    const completion = await service.doComplete(file, document.positionAt(source.length));
    const submit = completion.items.find(item => item.label === 'submit');
    assert.ok(submit);
    assert.equal(submit.textEdit.newText, 'submit');
    assert.equal(document.getText(submit.textEdit.range), 'sub');
    assert.equal(submit.data.uri, uri);
    assert.equal(submit.data.offset, source.length);
});

test('TypeScript completion resolve currently drops metadata without adding available details', async () => {
    const source = 'class Card {\n/** Sends data */\npublic submit(): void {}\n}\nconst card = new Card();\ncard.sub';
    const { service, file, document } = fixture(source);
    const item = (await service.doComplete(file, document.positionAt(source.length))).items.find(entry => entry.label === 'submit');
    assert.ok(item);
    const details = service.languageService.getCompletionEntryDetails(file.uri, source.length, 'submit', {}, undefined, {});
    assert.match(ts.displayPartsToString(details.displayParts), /submit\(\): void/);
    assert.match(ts.displayPartsToString(details.documentation), /Sends data/);
    const resolved = await service.doResolve(item);
    assert.equal(resolved.detail, undefined);
    assert.equal(resolved.documentation, undefined);
    assert.equal(resolved.data, undefined);
});

test('TypeScript hover and definition point from a method call to its declaration', async () => {
    const source = 'class Card {\n/** Sends data */\npublic submit(): void {}\n}\nconst card = new Card();\ncard.submit();';
    const { service, file, document, uri } = fixture(source);
    const callOffset = source.lastIndexOf('submit') + 2;
    const hover = await service.doHover(file, document.positionAt(callOffset));
    assert.match(hover?.contents?.value ?? '', /Sends data/);
    assert.equal(document.getText(hover.range), 'submit');
    const definitions = await service.findDefinition(file, document.positionAt(callOffset));
    assert.equal(definitions?.[0]?.uri, uri);
    assert.equal(document.getText(definitions[0].range), 'submit');
});

test('TypeScript formatting produces bounded edits and respects semicolon preference', async () => {
    const source = 'const value=1\n';
    const { service, file, document } = fixture(source);
    const range = { start: { line: 0, character: 0 }, end: { line: 0, character: source.length - 1 } };
    const inserted = await service.format(file, range, { insertSpaces: true, tabSize: 4 }, true);
    assert.ok(inserted.some(edit => edit.newText.includes(' ')));
    assert.ok(inserted.some(edit => edit.newText.includes(';')));
    const removed = await service.format(file, range, { insertSpaces: true, tabSize: 4 }, false);
    assert.ok(removed.every(edit => !edit.newText.includes(';')));
    assert.ok([...inserted, ...removed].every(edit => document.offsetAt(edit.range.end) <= source.length - 1));
});

test('TypeScript validation maps semantic diagnostics to the original document', () => {
    const source = 'const amount: number = "wrong";';
    const { service, file, document } = fixture(source);
    const diagnostics = service.doValidation(file);
    const mismatch = diagnostics.find(item => item.message.includes('not assignable to type'));
    assert.ok(mismatch);
    assert.equal(document.getText(mismatch.range), 'amount');
    assert.equal(mismatch.severity, 1);
    assert.equal(mismatch.source, 'Aventus Ts');
});
