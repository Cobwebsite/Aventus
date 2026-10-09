import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusGlobalSCSSLanguageService } = await loadServerModule('language-services/scss/GlobalLanguageService.ts');

function file(content, uri = 'file:///D:/app/round23-global.scss.avt') {
    return { uri, documentUser: TextDocument.create(uri, 'scss', 1, content) };
}

test('global SCSS validation reports an unclosed rule at its source range', async () => {
    const source = file(':root { --accent: red;');
    const diagnostics = await new AventusGlobalSCSSLanguageService().doValidation(source);
    assert.ok(diagnostics.some(item => item.severity === 1));
    assert.ok(diagnostics.every(item => source.documentUser.offsetAt(item.range.end) <= source.documentUser.getText().length));
});

test('global SCSS formatter groups custom properties before alphabetized declarations', async () => {
    const source = file(':root { z-index: 1; --z: blue; color: red; --a: green; }');
    const edits = await new AventusGlobalSCSSLanguageService().format(source, null, { tabSize: 2, insertSpaces: true });
    assert.equal(edits.length, 1);
    const formatted = TextDocument.applyEdits(source.documentUser, edits);
    assert.ok(formatted.indexOf('--z: blue') < formatted.indexOf('--a: green'));
    assert.ok(formatted.indexOf('--a: green') < formatted.indexOf('color: red'));
    assert.ok(formatted.indexOf('color: red') < formatted.indexOf('z-index: 1'));
});

test('global SCSS lookup has no definition for a literal and references identify that literal', async () => {
    const source = file(':root { --accent: red; } .card { color: blue; }');
    const service = new AventusGlobalSCSSLanguageService();
    const position = source.documentUser.positionAt(source.documentUser.getText().indexOf('blue') + 1);
    assert.equal(await service.findDefinition(source, position), null);
    const references = await service.onReferences(source, position);
    assert.deepEqual(references.map(item => source.documentUser.getText(item.range)), ['blue']);
});
