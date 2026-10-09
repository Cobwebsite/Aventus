import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusGlobalSCSSLanguageService } = await loadServerModule('language-services/scss/GlobalLanguageService.ts');
const { AventusSCSSLanguageService } = await loadServerModule('language-services/scss/LanguageService.ts');

function file(text, uri = 'file:///styles.scss.avt') {
    return { documentUser: TextDocument.create(uri, 'scss', 1, text) };
}

test('global SCSS discovers root variables and removes them with the source file', () => {
    const service = new AventusGlobalSCSSLanguageService();
    const uri = 'file:///global.scss.avt';
    const source = ':root { --accent: #123456; --spacing: 4px; } .card { --local: red; }';
    service.loadVariables({ file: file(source, uri) }, uri);
    assert.equal(service.getDefinition('--accent').value, '#123456');
    assert.equal(service.getDefinition('--spacing').uri, uri);
    assert.equal(service.getDefinition('--local'), undefined);
    const range = service.getDefinition('--accent').range;
    assert.equal(source.slice(file(source).documentUser.offsetAt(range.start), file(source).documentUser.offsetAt(range.end)), '--accent');
    service.removeVariables(uri);
    assert.equal(service.getDefinition('--accent'), undefined);
});

test('global SCSS replacement reloads variables for the same URI', () => {
    const service = new AventusGlobalSCSSLanguageService();
    const uri = 'file:///global.scss.avt';
    service.loadVariables({ file: file(':root { --old: red; }', uri) }, uri);
    service.loadVariables({ file: file(':root { --new: blue; }', uri) }, uri);
    assert.equal(service.getDefinition('--old'), undefined);
    assert.equal(service.getDefinition('--new').value, 'blue');
});

test('SCSS language service reports syntax diagnostics and ignores empty-rule warning', async () => {
    const service = new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });
    assert.deepEqual(await service.doValidation(file('.empty {}')), []);
    const diagnostics = await service.doValidation(file('.broken { color: red'));
    assert.ok(diagnostics.length > 0);
    assert.ok(diagnostics.some(item => item.severity === 1));
});

test('SCSS completion includes global CSS variables and definition points to their source', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    const uri = 'file:///global.scss.avt';
    global.loadVariables({ file: file(':root { --accent: #123456; }', uri) }, uri);
    const service = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const source = file('.card { color: var(--accent); }');
    const completion = await service.doComplete(source, { line: 0, character: 20 });
    assert.ok(completion.items.some(item => item.label === '--accent'));
    const definition = await service.findDefinition(source, { line: 0, character: 22 });
    assert.equal(definition?.[0]?.uri, uri);
});

test('SCSS custom properties extract documented host variables', () => {
    const properties = AventusSCSSLanguageService.getCustomProperty(':host { /* Accent color\n * @type color\n * @default red */ --internal-accent: var(--accent, red); }');
    assert.ok(properties.some(item => item.name === '--accent'));
});

test('SCSS documentation adds, replaces and removes internal and external definitions', () => {
    const service = new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });
    const external = { '.external': [{ name: 'old' }] };
    service.addExternalDefinition('file:///external.scss', external);
    assert.equal(service.getExternalDefinition('file:///external.scss'), external);
    service.addInternalDefinition('file:///component.scss', { '.component': [{ name: 'child' }] });
    assert.deepEqual(Object.keys(service.getInternalDocumentation()), ['.component']);
    service.removeExternalDefinition('file:///external.scss');
    service.removeInternalDefinition('file:///component.scss');
    assert.equal(service.getExternalDefinition('file:///external.scss'), undefined);
    assert.deepEqual(service.getInternalDocumentation(), {});
});

test('SCSS style links resolve selector references back to HTML and ignore other positions', () => {
    const service = new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });
    const css = file('.card { color: red; }');
    const html = { ...file('<div class="card"></div>', 'file:///view.html.avt'), uri: 'file:///view.html.avt' };
    const source = {
        file: css,
        htmlFile: { file: html, fileParsed: { styleLinks: [[{ start: 12, end: 16 }, { start: 1, end: 5 }]] } },
    };
    const result = service.getLinkToHtml(source, { line: 0, character: 2 });
    assert.equal(result.length, 1);
    assert.equal(result[0].uri, html.documentUser.uri);
    assert.equal(html.documentUser.getText(result[0].range), 'card');
    assert.deepEqual(service.getLinkToHtml(source, { line: 0, character: 10 }), []);
});

test('SCSS selector rules match corresponding HTML tags and classes', () => {
    const service = new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });
    const rules = service.getRules(file('.card { color: red; } button { color: blue; }'));
    const matching = { tagName: 'div', attributes: { class: { value: 'card active' } }, parent: null };
    const unrelated = { tagName: 'span', attributes: {}, parent: null };
    assert.ok([...rules.keys()].some(matches => matches(matching)));
    assert.ok([...rules.keys()].every(matches => !matches(unrelated)));
});

test('SCSS formatter orders declarations and returns applicable edits', async () => {
    const service = new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });
    const source = file('.card { z-index: 1; color: red; }');
    const edits = await service.format(source, null, { tabSize: 4, insertSpaces: true });
    assert.ok(edits.length > 0);
    const formatted = TextDocument.applyEdits(source.documentUser, edits);
    assert.ok(formatted.indexOf('color: red') < formatted.indexOf('z-index: 1'));
});

test('SCSS hover displays the value of a referenced global variable', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    global.loadVariables({ file: file(':root { --accent: #123456; }', 'file:///global.scss.avt') }, 'file:///global.scss.avt');
    const service = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const hover = await service.doHover(file('.card { color: var(--accent); }'), { line: 0, character: 22 });
    assert.match(hover?.contents?.value ?? '', /--accent: #123456/);
});
