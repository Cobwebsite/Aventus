import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ParserHtml }, { AventusHTMLLanguageService }, { AventusHTMLFile }, { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/LanguageService.ts',
    'language-services/html/File.ts',
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('navigation HTML suit ensemble les modifications de la logique TS et du style SCSS', async () => {
    const base = `file:///D:/test/cross-links-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const logicUri = `${base}.wcl.avt`;
    const viewUri = `${base}.wcv.avt`;
    const styleUri = `${base}.wcs.avt`;
    const viewText = '<button class="card" @click="submit">Send</button>';
    const viewDocument = TextDocument.create(viewUri, 'Aventus HTML', 1, viewText);
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
    const style = { file: { uri: styleUri } };
    const logic = { file: { uri: logicUri }, componentClassName: 'Card', getComponentName: () => 'Card' };
    build.tsFiles[logicUri] = logic;
    build.scssFiles[styleUri] = style;
    const view = Object.create(AventusHTMLFile.prototype);
    view._file = { uri: viewUri, versionUser: 1, documentUser: viewDocument };
    view._build = build;
    Object.defineProperty(view, 'tsFile', { value: logic });
    Object.defineProperty(view, 'scssFile', { value: style });
    const parseLogic = (source, version) => {
        const document = TextDocument.create(logicUri, 'typescript', version, source);
        logic.file = { uri: logicUri, versionInternal: version, documentUser: document, documentInternal: document };
        logic.fileParsed = ParserTs.parse(logic.file, false, build);
        return document;
    };
    const parseStyle = (source, version) => {
        const document = TextDocument.create(styleUri, 'scss', version, source);
        style.file = { uri: styleUri, documentUser: document };
        style.rules = scssService.getRules({ documentUser: document });
        ParserHtml.refreshStyle(view, build);
        return document;
    };
    view.fileParsed = ParserHtml.parse(view, build);
    const methodPosition = viewDocument.positionAt(viewText.indexOf('submit') + 2);
    const classPosition = viewDocument.positionAt(viewText.indexOf('card') + 2);
    const firstLogic = parseLogic('export class Card { public submit(): void {} }', 1);
    const firstStyle = parseStyle('.card { color: red; }', 1);
    const methodDefinition = await service.onDefinition(view, methodPosition);
    const styleDefinition = await service.onDefinition(view, classPosition);
    assert.equal(methodDefinition?.[0]?.uri, logicUri);
    assert.equal(firstLogic.getText(methodDefinition[0].range), 'submit');
    assert.equal(styleDefinition?.[0]?.uri, styleUri);
    assert.equal(firstStyle.getText(styleDefinition[0].range), '.card');

    parseLogic('export class Card { public send(): void {} }', 2);
    parseStyle('.other { color: blue; }', 2);
    assert.deepEqual(await service.onDefinition(view, methodPosition), []);
    assert.deepEqual(await service.onDefinition(view, classPosition), []);
});
