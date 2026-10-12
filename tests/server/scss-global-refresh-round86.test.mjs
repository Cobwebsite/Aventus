import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/scss/LanguageService.ts',
]);

function document(uri, text, version = 1) {
    return TextDocument.create(uri, 'scss', version, text);
}

test('reloading a global SCSS source replaces deleted variables and updates dependent definitions', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const themeUri = 'file:///D:/round86-theme.scss.avt';
    const fallbackUri = 'file:///D:/round86-fallback.scss.avt';
    const componentUri = 'file:///D:/round86-card.wcs.avt';
    const component = { documentUser: document(componentUri, '.card { color: var(--accent); gap: var(--gap); }') };
    const position = name => component.documentUser.positionAt(component.documentUser.getText().indexOf(name) + 3);
    const load = (uri, text, version = 1) => global.loadVariables({ file: { documentUser: document(uri, text, version) } }, uri);

    load(themeUri, ':root { --accent: red; --gap: 4px; }');
    load(fallbackUri, ':root { --accent: blue; }');
    assert.equal((await local.findDefinition(component, position('--accent')))?.[0]?.uri, themeUri);
    assert.equal(global.getDefinition('--gap').value, '4px');

    load(themeUri, ':root { --gap: 8px; }', 2);
    assert.equal(global.getDefinition('--gap').value, '8px');
    assert.equal((await local.findDefinition(component, position('--accent')))?.[0]?.uri, fallbackUri);
    assert.match((await local.doHover(component, position('--accent')))?.contents?.value ?? '', /--accent: blue/);

    global.removeVariables(fallbackUri);
    assert.equal(global.getDefinition('--accent'), undefined);
    assert.equal((await local.findDefinition(component, position('--accent')))?.[0]?.uri, undefined);
    global.removeVariables(themeUri);
    assert.equal(global.getDefinition('--gap'), undefined);
    assert.ok(!(await local.doComplete(component, position('--gap'))).items.some(item => item.label === '--gap'));
});

test('global SCSS references refresh with a changed declaration and use in the same file', async () => {
    const service = new AventusGlobalSCSSLanguageService();
    const uri = 'file:///D:/round86-global.scss.avt';
    const first = { documentUser: document(uri, ':root { --accent: red; } .a { color: var(--accent); }') };
    const second = { documentUser: document(uri, ':root { --shade: blue; } .b { color: var(--shade); }', 2) };
    const references = async (file, name) => {
        const text = file.documentUser.getText();
        const at = file.documentUser.positionAt(text.indexOf(name) + 3);
        const locations = await service.onReferences(file, at);
        return locations.map(location => file.documentUser.getText(location.range));
    };
    assert.deepEqual(await references(first, '--accent'), ['--accent', '--accent']);
    assert.deepEqual(await references(second, '--shade'), ['--shade', '--shade']);
    assert.equal((await service.findDefinition(second, second.documentUser.positionAt(second.documentUser.getText().lastIndexOf('--shade') + 3)))?.[0]?.uri, uri);
});

test('component reference lookup currently stays inside its own SCSS file for a global variable', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const globalUri = 'file:///D:/round86-reference-global.scss.avt';
    const localUri = 'file:///D:/round86-reference-card.wcs.avt';
    global.loadVariables({ file: { documentUser: document(globalUri, ':root { --accent: red; }') } }, globalUri);
    const component = { documentUser: document(localUri, '.card { color: var(--accent); border-color: var(--accent); }') };
    const position = component.documentUser.positionAt(component.documentUser.getText().indexOf('--accent') + 3);
    assert.equal((await local.findDefinition(component, position))?.[0]?.uri, globalUri);
    const references = await local.onReferences(component, position);
    assert.deepEqual(references.map(location => location.uri), [localUri, localUri]);
    assert.ok(references.every(location => component.documentUser.getText(location.range) === '--accent'));
});
