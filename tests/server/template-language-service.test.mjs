import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTemplateLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/template/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { _extensionPath: process.cwd(), logLevel: 99 };

function fixture(source, version = 1) {
    const uri = 'file:///d%3A/templates/example/template.avt.ts';
    const documentInternal = TextDocument.create(uri, 'typescript', version, source);
    return { uri, documentInternal, contentInternal: source, versionInternal: version };
}

test('template language service validates a script and reports a syntax error after update', () => {
    const service = new AventusTemplateLanguageService();
    const file = fixture('export class Template { value = 1; }');
    service.addFile(file);
    assert.deepEqual(service.doValidation(file), []);
    file.documentInternal = TextDocument.create(file.uri, 'typescript', 2, 'export class Template { value = ; }');
    file.contentInternal = file.documentInternal.getText();
    file.versionInternal = 2;
    const diagnostics = service.doValidation(file);
    assert.ok(diagnostics.some(diagnostic => diagnostic.range.start.line === 0 && diagnostic.message));
    service.removeFile(file);
    assert.equal(service.filesNeeded.includes(file.uri), false);
});

test('template language service offers local completions and hover', async () => {
    const service = new AventusTemplateLanguageService();
    const file = fixture('class Template { customProperty = 1; run() { this. } }');
    service.addFile(file);
    const character = file.contentInternal.indexOf('this.') + 5;
    const completion = await service.doComplete(file, { line: 0, character });
    const property = completion.items.find(item => item.label === 'customProperty');
    assert.ok(property);
    assert.equal(property.data.uri, file.uri);
    assert.equal((await service.doResolve(property)).label, 'customProperty');
    const hoverPosition = file.contentInternal.indexOf('customProperty') + 2;
    const hover = await service.doHover(file, { line: 0, character: hoverPosition });
    assert.match(hover.contents.value, /customProperty/);
});

test('template language service formats a script using requested indentation', async () => {
    const service = new AventusTemplateLanguageService();
    const file = fixture('class Template{run(){return 1}}');
    service.addFile(file);
    const range = { start: { line: 0, character: 0 }, end: file.documentInternal.positionAt(file.contentInternal.length) };
    const edits = await service.format(file, range, { tabSize: 4, insertSpaces: true });
    const result = TextDocument.applyEdits(file.documentInternal, edits);
    assert.match(result, /class Template \{/);
    assert.match(result, /return 1;/);
});
