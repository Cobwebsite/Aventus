import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/scss/LanguageService.ts',
]);

function source(content, uri) {
    return { documentUser: TextDocument.create(uri, 'scss', 1, content) };
}

test('global SCSS variable collision falls back to the remaining source after removal', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    const firstUri = 'file:///first.scss.avt';
    const secondUri = 'file:///second.scss.avt';
    global.loadVariables({ file: source(':root { --accent: red; }', firstUri) }, firstUri);
    global.loadVariables({ file: source(':root { --accent: blue; --gap: 1rem; }', secondUri) }, secondUri);
    const service = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const component = source('.card { color: var(--accent); gap: var(--gap); }', 'file:///card.wcs.avt');
    const accent = component.documentUser.positionAt(component.documentUser.getText().indexOf('--accent') + 3);
    assert.equal(global.getDefinition('--accent').uri, firstUri);
    assert.equal((await service.findDefinition(component, accent))?.[0]?.uri, firstUri);
    global.removeVariables(firstUri);
    assert.equal(global.getDefinition('--accent').value, 'blue');
    assert.equal((await service.findDefinition(component, accent))?.[0]?.uri, secondUri);
    assert.equal(global.getDefinition('--gap').uri, secondUri);
    global.removeVariables(secondUri);
    assert.equal(global.getDefinition('--accent'), undefined);
    assert.equal((await service.findDefinition(component, accent))?.[0]?.uri, undefined);
});

test('global SCSS indexes only root declarations and preserves their precise ranges', () => {
    const global = new AventusGlobalSCSSLanguageService();
    const uri = 'file:///nested.scss.avt';
    const content = '.component { --local: red; }\n:root {\n  --primary: #123;\n  --primary: #456;\n}\n';
    const file = source(content, uri);
    global.loadVariables({ file }, uri);
    assert.equal(global.getDefinition('--local'), undefined);
    const variable = global.getDefinition('--primary');
    assert.equal(variable.value, '#123');
    assert.equal(variable.range.start.line, 2);
    assert.equal(file.documentUser.getText(variable.range), '--primary');
});
