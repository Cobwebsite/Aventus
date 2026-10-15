import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ParserHtml }, { AventusHTMLLanguageService }, { AventusHTMLFile }, { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'language-services/html/parser/ParserHtml.ts', 'language-services/html/LanguageService.ts',
    'language-services/html/File.ts', 'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('HTML definitions follow independent logic, view and style revisions in one component', async () => {
    const base = `file:///D:/test/cross-links-round177-${process.pid}-${Math.random().toString(36).slice(2)}`;
    const logicUri = `${base}.wcl.avt`, viewUri = `${base}.wcv.avt`, styleUri = `${base}.wcs.avt`;
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        getAvoidParsingTags: () => [], getWebComponentDefinition: () => null,
        tsFiles: {}, scssFiles: {},
    };
    const service = Object.create(AventusHTMLLanguageService.prototype);
    service.build = build;
    service.extenalDocumentation = {};
    service.internalDocumentation = {};
    service.internalDocumentationReverse = {};
    service.internalTagUri = {};
    service._allowRebuildDefinition = true;
    service.rebuildDefinition();
    service.languageService = getLanguageService({ customDataProviders: [service.defaultProvider()] });
    build.htmlLanguageService = service;
    const scssService = new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });
    const logic = { file: { uri: logicUri }, componentClassName: 'Card', getComponentName: () => 'Card' };
    const style = { file: { uri: styleUri } };
    const view = Object.create(AventusHTMLFile.prototype);
    view._file = { uri: viewUri, versionUser: 0 };
    view._build = build;
    Object.defineProperty(view, 'tsFile', { value: logic });
    Object.defineProperty(view, 'scssFile', { value: style });
    style.htmlFile = view;
    build.tsFiles[logicUri] = logic;
    build.scssFiles[styleUri] = style;

    const updateLogic = (source, version) => {
        const doc = TextDocument.create(logicUri, 'typescript', version, source);
        logic.file = { uri: logicUri, versionInternal: version, documentUser: doc, documentInternal: doc };
        logic.fileParsed = ParserTs.parse(logic.file, false, build);
    };
    const updateStyle = (source, version) => {
        style.file.documentUser = TextDocument.create(styleUri, 'scss', version, source);
        style.rules = scssService.getRules(style.file);
        ParserHtml.refreshStyle(view, build);
    };
    const updateView = (source, version) => {
        view.file.versionUser = version;
        view.file.documentUser = TextDocument.create(viewUri, 'Aventus HTML', version, source);
        view.fileParsed = ParserHtml.parse(view, build);
        ParserHtml.refreshStyle(view, build);
    };
    const definitionText = async (token) => {
        const doc = view.file.documentUser;
        const index = doc.getText().indexOf(token);
        assert.ok(index >= 0);
        const links = await service.onDefinition(view, doc.positionAt(index + 1));
        return links?.map(link => ({ uri: link.uri, text: (link.uri === logicUri ? logic.file.documentUser : style.file.documentUser).getText(link.range) })) ?? [];
    };

    updateLogic('export class Card { public submit(): void {} }', 1);
    updateView('<button class="card" @click="submit">Go</button>', 1);
    updateStyle('.card { color: red; }', 1);
    assert.deepEqual(await definitionText('submit'), [{ uri: logicUri, text: 'submit' }]);
    assert.deepEqual(await definitionText('card'), [{ uri: styleUri, text: '.card' }]);

    updateLogic('export class Card { public send(): void {} }', 2);
    assert.deepEqual(await definitionText('submit'), []);
    assert.deepEqual(await definitionText('card'), [{ uri: styleUri, text: '.card' }]);

    updateView('\n<section>\n  <button class="panel" @click="send">Go</button>\n</section>', 2);
    assert.deepEqual(await definitionText('send'), [{ uri: logicUri, text: 'send' }]);
    assert.deepEqual(await definitionText('panel'), []);

    updateStyle('.panel { color: blue; }', 2);
    assert.deepEqual(await definitionText('send'), [{ uri: logicUri, text: 'send' }]);
    assert.deepEqual(await definitionText('panel'), [{ uri: styleUri, text: '.panel' }]);
});
