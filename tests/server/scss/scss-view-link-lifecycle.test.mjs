import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ParserHtml }, { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }] = await loadServerModules([
    'language-services/html/parser/ParserHtml.ts',
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
]);

test('SCSS to HTML navigation follows selector edits and view removal', () => {
    const viewUri = 'file:///D:/round64-card.wcv.avt';
    const styleUri = 'file:///D:/round64-card.wcs.avt';
    const service = new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const view = { file: { uri: viewUri }, tsFile: null };
    const style = { file: { uri: styleUri }, htmlFile: view };
    view.scssFile = style;

    const setView = (source, version) => {
        view.file.versionUser = version;
        view.file.documentUser = TextDocument.create(viewUri, 'Aventus HTML', version, source);
        view.fileParsed = ParserHtml.parse(view, build);
        ParserHtml.refreshStyle(view, build);
    };
    const setStyle = (source, version) => {
        style.file.documentUser = TextDocument.create(styleUri, 'scss', version, source);
        style.rules = service.getRules(style.file);
        if (view.fileParsed) ParserHtml.refreshStyle(view, build);
    };
    const target = selector => style.file.documentUser.positionAt(style.file.documentUser.getText().indexOf(selector) + 2);
    const linkedClass = selector => {
        const locations = service.getLinkToHtml(style, target(selector));
        assert.equal(locations.length, 1);
        assert.equal(locations[0].uri, viewUri);
        return view.file.documentUser.getText(locations[0].range);
    };

    setStyle('.card { color: red; }', 1);
    setView('<div class="card"></div>', 1);
    assert.match(linkedClass('.card'), /class="card"/);

    setStyle('.panel { color: blue; }', 2);
    assert.deepEqual(service.getLinkToHtml(style, target('.panel')), []);
    setView('<section class="panel"></section>', 2);
    assert.match(linkedClass('.panel'), /class="panel"/);

    setView('<section class="other"></section>', 3);
    assert.deepEqual(service.getLinkToHtml(style, target('.panel')), []);
    style.htmlFile = null;
    assert.deepEqual(service.getLinkToHtml(style, target('.panel')), []);
});

test('SCSS selector completion follows external documentation replacement and removal', async () => {
    const service = new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });
    const uri = 'file:///D:/round64-documentation.scss.avt';
    const file = { documentUser: TextDocument.create(uri, 'scss', 1, '.card { color: red; }') };
    const position = file.documentUser.positionAt(file.documentUser.getText().indexOf('color'));
    const complete = async () => (await service.doComplete(file, position)).items.map(item => item.label);
    const source = 'file:///D:/round64-external.scss.avt';
    service.addExternalDefinition(source, { '.card': [{ name: 'first-property' }] });
    assert.ok((await complete()).includes('first-property'));
    service.addExternalDefinition(source, { '.card': [{ name: 'second-property' }] });
    const replaced = await complete();
    assert.ok(replaced.includes('second-property'));
    assert.ok(!replaced.includes('first-property'));
    service.removeExternalDefinition(source);
    assert.ok(!(await complete()).includes('second-property'));
});

test('SCSS hover and global completion survive an invalid intermediate edit', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const globalUri = 'file:///D:/round64-theme.scss.avt';
    const localUri = 'file:///D:/round64-component.scss.avt';
    const loadGlobal = (text, version) => global.loadVariables({ file: {
        documentUser: TextDocument.create(globalUri, 'scss', version, text),
    } }, globalUri);
    const component = (text, version) => {
        const documentUser = TextDocument.create(localUri, 'scss', version, text);
        return { documentUser, position: documentUser.positionAt(text.indexOf('--accent') + 3) };
    };
    const valid = component('.card { color: var(--accent); }', 1);
    loadGlobal(':root { --accent: red; }', 1);
    assert.match((await local.doHover(valid, valid.position))?.contents?.value ?? '', /--accent: red/);
    assert.ok((await local.doComplete(valid, valid.position)).items.some(item => item.label === '--accent'));

    const broken = component('.card { color: var(--accent);', 2);
    assert.ok((await local.doValidation(broken)).length > 0);
    assert.match((await local.doHover(broken, broken.position))?.contents?.value ?? '', /--accent: red/);
    loadGlobal(':root { --accent: blue; }', 2);
    const repaired = component('.card { color: var(--accent); }', 3);
    assert.deepEqual(await local.doValidation(repaired), []);
    assert.match((await local.doHover(repaired, repaired.position))?.contents?.value ?? '', /--accent: blue/);
    global.removeVariables(globalUri);
    assert.doesNotMatch((await local.doHover(repaired, repaired.position))?.contents?.value ?? '', /--accent: blue/);
    assert.ok(!(await local.doComplete(repaired, repaired.position)).items.some(item => item.label === '--accent'));
});
