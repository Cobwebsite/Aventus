import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/scss/LanguageService.ts',
]);

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

test('global variable index includes a grouped root selector but ignores other selectors', () => {
    const service = new AventusGlobalSCSSLanguageService();
    const uri = 'file:///D:/round124-grouped.scss.avt';
    load(service, uri, ':root, html { --accent: navy; }\n:root { --standalone: white; }\nhtml { --local: red; }');

    assert.equal(service.getDefinition('--standalone').value, 'white');
    assert.equal(service.getDefinition('--accent').value, 'navy');
    assert.equal(service.getDefinition('--local'), undefined);
});

test('global variable navigation and hover follow the last root declaration in a file', async () => {
    const service = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: service });
    const uri = 'file:///D:/round124-duplicate.scss.avt';
    const doc = load(service, uri, ':root { --accent: red; }\n:root { --accent: blue; }');
    const consumerUri = 'file:///D:/round124-consumer.wcs.avt';
    const consumer = { documentUser: TextDocument.create(consumerUri, 'scss', 1, '.card { color: var(--accent); }') };
    const position = consumer.documentUser.positionAt(consumer.documentUser.getText().indexOf('--accent') + 3);

    const accent = service.getDefinition('--accent');
    assert.equal(accent.value, 'blue');
    assert.equal(doc.getText(accent.range), '--accent');
    assert.deepEqual(accent.range.start, { line: 1, character: 8 });
    assert.deepEqual((await local.findDefinition(consumer, position))?.[0], { uri, range: accent.range });
    assert.equal((await local.doHover(consumer, position))?.contents.value, '--accent: blue');

    load(service, uri, ':root { --accent: red; }', 2);
    assert.equal(service.getDefinition('--accent').value, 'red');
    assert.equal((await local.doHover(consumer, position))?.contents.value, '--accent: red');
});

test('conditional root declaration follows source order for navigation', () => {
    const service = new AventusGlobalSCSSLanguageService();
    const uri = 'file:///D:/round124-conditional.scss.avt';
    load(service, uri, ':root { --accent: red; }\n@media (prefers-color-scheme: dark) { :root { --accent: blue; } }');
    assert.equal(service.getDefinition('--accent').value, 'blue');
});
