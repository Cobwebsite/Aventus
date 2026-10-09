import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
]);

function source(content, uri = 'file:///styles.scss.avt') {
    return { documentUser: TextDocument.create(uri, 'scss', 1, content) };
}

function services() {
    const global = new AventusGlobalSCSSLanguageService();
    return { global, local: new AventusSCSSLanguageService({ globalSCSSLanguageService: global }) };
}

test('SCSS completion and definition track global variable updates and removal', async () => {
    const { global, local } = services();
    const uri = 'file:///theme.scss.avt';
    const first = source(':root { --accent: red; }', uri);
    global.loadVariables({ file: first }, uri);
    const component = source('.card { color: var(--accent); }');
    const position = component.documentUser.positionAt(component.documentUser.getText().indexOf('--accent') + 3);
    assert.ok((await local.doComplete(component, position)).items.some(item => item.label === '--accent'));
    assert.equal((await local.findDefinition(component, position))?.[0]?.uri, uri);
    assert.match((await local.doHover(component, position))?.contents?.value ?? '', /--accent: red/);

    global.loadVariables({ file: source(':root { --primary: blue; }', uri) }, uri);
    assert.equal(global.getDefinition('--accent'), undefined);
    assert.equal((await local.findDefinition(component, position))?.[0]?.uri, undefined);
    assert.ok((await local.doComplete(component, position)).items.some(item => item.label === '--primary'));
    global.removeVariables(uri);
    assert.equal(global.getDefinition('--primary'), undefined);
});

test('SCSS definitions can be batched without rebuilding intermediate documentation', () => {
    const { local } = services();
    local.allowRebuildDefinition(false);
    local.addExternalDefinition('file:///library.scss.avt', { '.library': [{ name: 'first' }] });
    local.addInternalDefinition('file:///component.scss.avt', { '.component': [{ name: 'second' }] });
    assert.deepEqual(local.documentationInfo, {});
    local.allowRebuildDefinition(true);
    assert.deepEqual(Object.keys(local.documentationInfo).sort(), ['.component', '.library']);
    local.removeExternalDefinition('file:///library.scss.avt');
    assert.deepEqual(Object.keys(local.documentationInfo), ['.component']);
    local.removeInternalDefinition('file:///component.scss.avt');
    assert.deepEqual(local.documentationInfo, {});
});

test('global SCSS diagnostics, references, formatting and code actions are callable on valid source', async () => {
    const { global } = services();
    const file = source(':root { --accent: red; } .card { color: var(--accent); }');
    assert.deepEqual(await global.doValidation(file), []);
    const position = file.documentUser.positionAt(file.documentUser.getText().lastIndexOf('--accent') + 3);
    const definitions = await global.findDefinition(file, position);
    assert.equal(definitions?.[0]?.uri, file.documentUser.uri);
    const references = await global.onReferences(file, position);
    assert.ok(references.length >= 1);
    const actions = await global.doCodeAction(file, { start: position, end: position });
    assert.ok(Array.isArray(actions));
    const edits = await global.format(file, null, { insertSpaces: true, tabSize: 2 });
    assert.ok(edits.length > 0);
    assert.match(TextDocument.applyEdits(file.documentUser, edits), /--accent: red/);
});

test('SCSS syntax error yields a diagnostic and code actions remain safe', async () => {
    const { local, global } = services();
    const file = source('.card { color: red');
    const diagnostic = (await local.doValidation(file))[0];
    assert.ok(diagnostic);
    assert.equal(diagnostic.severity, 1);
    assert.ok((await global.doValidation(file)).length > 0);
    const actions = await local.doCodeAction(file, diagnostic.range);
    assert.ok(Array.isArray(actions));
});
