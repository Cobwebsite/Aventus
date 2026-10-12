import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusGlobalSCSSLanguageService } = await loadServerModule('language-services/scss/GlobalLanguageService.ts');

function load(service, uri, content, version = 1) {
    const documentUser = TextDocument.create(uri, 'scss', version, content);
    service.loadVariables({ file: { documentUser } }, uri);
    return documentUser;
}

test('global variable index follows root declarations inside media rules and removes them on edit', () => {
    const service = new AventusGlobalSCSSLanguageService();
    const uri = 'file:///D:/round124-variables.scss.avt';
    const first = load(service, uri, '@media (prefers-color-scheme: dark) {\r\n  :root { --accent: navy; }\r\n}\r\n.card { --local: red; }');

    const accent = service.getDefinition('--accent');
    assert.equal(accent.uri, uri);
    assert.equal(accent.value, 'navy');
    assert.equal(first.getText(accent.range), '--accent');
    assert.deepEqual(accent.range.start, { line: 1, character: 10 });
    assert.equal(service.getDefinition('--local'), undefined);

    load(service, uri, '@media (prefers-color-scheme: dark) { :root { --replacement: white; } }', 2);
    assert.equal(service.getDefinition('--accent'), undefined);
    assert.equal(service.getDefinition('--replacement').value, 'white');
});

test('global variable index currently omits a root selector grouped with another selector', () => {
    const service = new AventusGlobalSCSSLanguageService();
    const uri = 'file:///D:/round124-grouped.scss.avt';
    load(service, uri, ':root, html { --accent: navy; }\n:root { --standalone: white; }');

    assert.equal(service.getDefinition('--standalone').value, 'white');
    assert.equal(service.getDefinition('--accent'), undefined);
});

test('global variable index keeps the first duplicate root declaration while CSS uses the last', () => {
    const service = new AventusGlobalSCSSLanguageService();
    const uri = 'file:///D:/round124-duplicate.scss.avt';
    const doc = load(service, uri, ':root { --accent: red; }\n:root { --accent: blue; }');

    const accent = service.getDefinition('--accent');
    assert.equal(accent.value, 'red');
    assert.equal(doc.getText(accent.range), '--accent');
    assert.deepEqual(accent.range.start, { line: 0, character: 8 });

    load(service, uri, ':root { --accent: blue; }', 2);
    assert.equal(service.getDefinition('--accent').value, 'blue');
});
