import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserHtml }, { AventusHTMLLanguageService }, { AventusHTMLFile }, { AventusWebSCSSFile }, { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/LanguageService.ts',
    'language-services/html/File.ts',
    'language-services/scss/File.ts',
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
]);

test('HTML class links track separate selectors through view and style revisions', async () => {
    const base = `file:///D:/test/style-links-round193-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const viewUri = `${base}.wcv.avt`;
    const styleUri = `${base}.wcs.avt`;
    const build = {
        getAvoidParsingTags: () => [],
        getWebComponentDefinition: () => null,
        tsFiles: {}, scssFiles: {},
    };
    const htmlService = Object.create(AventusHTMLLanguageService.prototype);
    htmlService.build = build;
    htmlService.extenalDocumentation = {};
    htmlService.internalDocumentation = {};
    htmlService.internalDocumentationReverse = {};
    htmlService.internalTagUri = {};
    htmlService._allowRebuildDefinition = true;
    htmlService.rebuildDefinition();
    build.htmlLanguageService = htmlService;
    const scssService = new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });

    const view = Object.create(AventusHTMLFile.prototype);
    view._build = build;
    const style = Object.create(AventusWebSCSSFile.prototype);
    style._file = { uri: styleUri };
    Object.defineProperty(style, 'rules', { configurable: true, get() { return scssService.getRules({ documentUser: style._file.documentUser }); } });
    build.scssFiles[styleUri] = style;

    const revisions = [
        { html: '<div class="card active"></div>', css: '.card { color: red; }\n.active { color: blue; }', classes: ['card', 'active'] },
        { html: '<section class="active card"></section>', css: '.active { color: green; }\n.card { color: black; }', classes: ['active', 'card'] },
        { html: '<section class="card ready"></section>', css: '.card { color: black; }\n.ready { color: yellow; }', classes: ['card', 'ready'] },
    ];
    for (const [index, revision] of revisions.entries()) {
        const version = index + 1;
        const viewDoc = TextDocument.create(viewUri, 'Aventus HTML', version, revision.html);
        const styleDoc = TextDocument.create(styleUri, 'scss', version, revision.css);
        view._file = { uri: viewUri, versionUser: version, documentUser: viewDoc };
        style._file.documentUser = styleDoc;
        view.fileParsed = ParserHtml.parse(view, build);
        ParserHtml.refreshStyle(view, build);
        for (const className of revision.classes) {
            const position = viewDoc.positionAt(revision.html.indexOf(className) + 1);
            const links = await view.onDefinition(view.file, position);
            assert.equal(links?.[0]?.uri, styleUri, `${className} revision ${version}`);
            assert.ok(links.some(link => styleDoc.getText(link.range) === `.${className}`), `${className} revision ${version}: ${links.map(link => styleDoc.getText(link.range)).join(', ')}`);
        }
        for (const removed of ['active', 'ready'].filter(name => !revision.classes.includes(name))) {
            assert.equal(revision.html.includes(removed), false);
        }
    }
});
