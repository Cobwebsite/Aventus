import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ParserHtml }, { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }, { AventusHTMLLanguageService }] = await loadServerModules([
    'language-services/html/parser/ParserHtml.ts',
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/html/LanguageService.ts',
]);

test('multiple HTML class uses link to the same SCSS selector and update after both sides are edited', () => {
    const base = `file:///D:/test/multiple-style-links-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const viewUri = `${base}.wcv.avt`;
    const styleUri = `${base}.wcs.avt`;
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const view = { file: { uri: viewUri }, tsFile: null };
    const style = { file: { uri: styleUri }, htmlFile: view };
    view.scssFile = style;
    const scssService = new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });
    const htmlService = Object.create(AventusHTMLLanguageService.prototype);
    htmlService.build = build;
    build.htmlLanguageService.getLinkToStyle = htmlService.getLinkToStyle.bind(htmlService);

    const update = (viewText, styleText, version) => {
        style.file.documentUser = TextDocument.create(styleUri, 'scss', version, styleText);
        style.rules = scssService.getRules(style.file);
        view.file.versionUser = version;
        view.file.documentUser = TextDocument.create(viewUri, 'Aventus HTML', version, viewText);
        view.fileParsed = ParserHtml.parse(view, build);
        ParserHtml.refreshStyle(view, build);
    };
    const at = (document, token, occurrence = 0) => {
        const text = document.getText();
        let index = -1;
        for (let i = 0; i <= occurrence; i++) index = text.indexOf(token, index + 1);
        assert.ok(index >= 0);
        return document.positionAt(index + 2);
    };
    const linkText = (locations, document) => locations.map(location => {
        assert.equal(location.uri, document.uri);
        return document.getText(location.range);
    });

    update('<div class="card"></div><button class="card"></button>', '.card { color: red; }', 1);
    for (let occurrence = 0; occurrence < 2; occurrence++) {
        assert.deepEqual(linkText(htmlService.getLinkToStyle(view, at(view.file.documentUser, 'card', occurrence)), style.file.documentUser), ['.card']);
    }
    assert.equal(scssService.getLinkToHtml(style, at(style.file.documentUser, '.card')).length, 2);

    update('<div class="panel"></div><button class="card"></button>', '.panel { color: blue; } .card { color: red; }', 2);
    assert.deepEqual(linkText(htmlService.getLinkToStyle(view, at(view.file.documentUser, 'panel')), style.file.documentUser), ['.panel']);
    assert.deepEqual(linkText(htmlService.getLinkToStyle(view, at(view.file.documentUser, 'card')), style.file.documentUser), ['.card']);
    assert.equal(scssService.getLinkToHtml(style, at(style.file.documentUser, '.panel')).length, 1);
    assert.equal(scssService.getLinkToHtml(style, at(style.file.documentUser, '.card')).length, 1);

    update('<div class="panel"></div><button class="card"></button>', '.panel { color: blue; }', 3);
    assert.deepEqual(htmlService.getLinkToStyle(view, at(view.file.documentUser, 'card')), []);
    assert.equal(scssService.getLinkToHtml(style, at(style.file.documentUser, '.panel')).length, 1);
});
