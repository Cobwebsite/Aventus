import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ParserHtml }, { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }, { AventusHTMLLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/html/parser/ParserHtml.ts',
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/html/LanguageService.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('nested selector links follow HTML reparenting and SCSS edits without stale destinations', () => {
    const base = `file:///D:/test/nested-links-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const viewUri = `${base}.wcv.avt`;
    const styleUri = `${base}.wcs.avt`;
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const view = { file: { uri: viewUri }, tsFile: null };
    const style = { file: { uri: styleUri }, htmlFile: view };
    view.scssFile = style;
    const scss = new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });
    const html = Object.create(AventusHTMLLanguageService.prototype);
    html.build = build;
    build.htmlLanguageService.getLinkToStyle = html.getLinkToStyle.bind(html);

    const update = (viewText, styleText, version) => {
        style.file.documentUser = TextDocument.create(styleUri, 'scss', version, styleText);
        style.rules = scss.getRules(style.file);
        view.file.versionUser = version;
        view.file.documentUser = TextDocument.create(viewUri, 'Aventus HTML', version, viewText);
        view.fileParsed = ParserHtml.parse(view, build);
        ParserHtml.refreshStyle(view, build);
    };
    const htmlLinks = token => {
        const doc = view.file.documentUser;
        const offset = doc.getText().indexOf(token);
        assert.ok(offset >= 0);
        return html.getLinkToStyle(view, doc.positionAt(offset + 2)).map(location => {
            assert.equal(location.uri, styleUri);
            return style.file.documentUser.getText(location.range);
        });
    };
    const scssLinks = token => {
        const doc = style.file.documentUser;
        const offset = doc.getText().indexOf(token);
        assert.ok(offset >= 0);
        return scss.getLinkToHtml(style, doc.positionAt(offset + 2)).map(location => {
            assert.equal(location.uri, viewUri);
            return view.file.documentUser.getText(location.range);
        });
    };

    update('<section class="panel"><span class="item"></span></section><span class="item"></span>',
        '.panel { .item { color: red; } }', 1);
    assert.deepEqual(htmlLinks('item'), ['.item']);
    assert.deepEqual(scssLinks('.item'), ['span class="item"']);

    update('<section class="panel"></section><span class="item"></span>',
        '.panel { .item { color: red; } }', 2);
    assert.deepEqual(htmlLinks('item'), []);
    assert.deepEqual(scssLinks('.item'), []);

    update('<section class="panel"></section><span class="item"></span>',
        '.item { color: blue; }', 3);
    assert.deepEqual(htmlLinks('item'), ['.item']);
    assert.deepEqual(scssLinks('.item'), ['span class="item"']);
});

test('compound element and class selector links only the matching HTML tag', () => {
    const base = `file:///D:/test/compound-links-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const viewUri = `${base}.wcv.avt`;
    const styleUri = `${base}.wcs.avt`;
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const view = { file: { uri: viewUri }, tsFile: null };
    const style = { file: { uri: styleUri }, htmlFile: view };
    view.scssFile = style;
    const scss = new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });
    const html = Object.create(AventusHTMLLanguageService.prototype);
    html.build = build;
    build.htmlLanguageService.getLinkToStyle = html.getLinkToStyle.bind(html);
    style.file.documentUser = TextDocument.create(styleUri, 'scss', 1, 'button.primary { color: red; }');
    style.rules = scss.getRules(style.file);
    const update = (source, version) => {
        view.file.versionUser = version;
        view.file.documentUser = TextDocument.create(viewUri, 'Aventus HTML', version, source);
        view.fileParsed = ParserHtml.parse(view, build);
        ParserHtml.refreshStyle(view, build);
    };
    const links = (token, occurrence = 0) => {
        const doc = view.file.documentUser;
        let offset = -1;
        for (let i = 0; i <= occurrence; i++) offset = doc.getText().indexOf(token, offset + 1);
        assert.ok(offset >= 0);
        return html.getLinkToStyle(view, doc.positionAt(offset + 2)).map(location => style.file.documentUser.getText(location.range));
    };

    update('<button class="primary"></button><div class="primary"></div>', 1);
    assert.deepEqual(links('primary', 0), ['button.primary']);
    assert.deepEqual(links('primary', 1), []);
    update('<div class="primary"></div><button class="primary"></button>', 2);
    assert.deepEqual(links('primary', 0), []);
    assert.deepEqual(links('primary', 1), ['button.primary']);
});
