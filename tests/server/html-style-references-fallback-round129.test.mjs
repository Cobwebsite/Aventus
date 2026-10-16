import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ParserHtml }, { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService },
    { AventusHTMLLanguageService }, { AventusHTMLFile }] = await loadServerModules([
    'language-services/html/parser/ParserHtml.ts',
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/html/LanguageService.ts',
    'language-services/html/File.ts',
]);

test('HTML style references remain available when attached TypeScript returns an empty list', async () => {
    const base = `file:///D:/test/html-style-references-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const viewUri = `${base}.wcv.avt`;
    const styleUri = `${base}.wcs.avt`;
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: null };
    const view = Object.create(AventusHTMLFile.prototype);
    view._file = { uri: viewUri };
    view._build = build;
    const style = { file: { uri: styleUri }, htmlFile: view };
    Object.defineProperty(view, 'scssFile', { value: style });
    const htmlService = Object.create(AventusHTMLLanguageService.prototype);
    htmlService.build = build;
    build.htmlLanguageService = htmlService;
    const scssService = new AventusSCSSLanguageService({
        globalSCSSLanguageService: new AventusGlobalSCSSLanguageService(),
    });

    const update = (viewText, styleText, version) => {
        style.file.documentUser = TextDocument.create(styleUri, 'scss', version, styleText);
        style.rules = scssService.getRules(style.file);
        view.file.versionUser = version;
        view.file.documentUser = TextDocument.create(viewUri, 'Aventus HTML', version, viewText);
        view.fileParsed = ParserHtml.parse(view, build);
        ParserHtml.refreshStyle(view, build);
    };
    const references = async (name, tsResult) => {
        Object.defineProperty(view, 'tsFile', { configurable: true, value: { doReferences: async () => tsResult } });
        const doc = view.file.documentUser;
        const offset = doc.getText().indexOf(name);
        assert.ok(offset >= 0);
        return view.onReferences(view.file, doc.positionAt(offset + 2));
    };

    update('<div class="card"></div><button class="card"></button>', '.card { color: red; }', 1);
    assert.deepEqual((await references('card', null)).map(item => item.uri), [styleUri]);
    assert.deepEqual((await references('card', [])).map(item => item.uri), [styleUri]);

    update('<div class="panel"></div><button class="panel"></button>', '.panel { color: blue; }', 2);
    assert.deepEqual((await references('panel', null)).map(item => style.file.documentUser.getText(item.range)), ['.panel']);
    assert.deepEqual((await references('panel', [])).map(item => style.file.documentUser.getText(item.range)), ['.panel']);
    const tsReference = { uri: `${base}.wcl.avt`, range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } } };
    assert.deepEqual(await references('panel', [tsReference]), [tsReference]);
});
