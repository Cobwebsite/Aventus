import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusGlobalSCSSLanguageService } = await loadServerModule('language-services/scss/GlobalLanguageService.ts');

function source(uri, content) {
    return { file: { documentUser: TextDocument.create(uri, 'scss', 1, content) } };
}

test('global SCSS variables fall back to another source after the first source is removed', () => {
    const service = new AventusGlobalSCSSLanguageService();
    const first = 'file:///first.scss.avt';
    const second = 'file:///second.scss.avt';
    service.loadVariables(source(first, ':root { --accent: red; }'), first);
    service.loadVariables(source(second, ':root { --accent: blue; --spacing: 8px; }'), second);
    assert.equal(service.getDefinition('--accent').uri, first);
    assert.equal(service.getDefinition('--accent').value, 'red');
    service.removeVariables(first);
    assert.equal(service.getDefinition('--accent').uri, second);
    assert.equal(service.getDefinition('--accent').value, 'blue');
    assert.equal(service.getDefinition('--spacing').value, '8px');
    service.removeVariables(second);
    assert.equal(service.getDefinition('--accent'), undefined);
});

test('global SCSS variable positions remain accurate with multiline CRLF documents', () => {
    const service = new AventusGlobalSCSSLanguageService();
    const uri = 'file:///multiline.scss.avt';
    const content = '.local { --ignored: red; }\r\n:root {\r\n  --accent: rgb(1, 2, 3);\r\n}';
    const input = source(uri, content);
    service.loadVariables(input, uri);
    assert.equal(service.getDefinition('--ignored'), undefined);
    const definition = service.getDefinition('--accent');
    assert.equal(input.file.documentUser.getText(definition.range), '--accent');
    assert.deepEqual(definition.range.start, { line: 2, character: 2 });
    assert.equal(definition.value, 'rgb(1, 2, 3)');
});
