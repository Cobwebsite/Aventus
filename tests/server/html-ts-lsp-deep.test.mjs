import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ParserHtml }, { AventusHTMLLanguageService }, { AventusHTMLFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/LanguageService.ts',
    'language-services/html/File.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };
let fixtureId = 0;

function fixture(viewText, classText) {
    const id = ++fixtureId;
    const logicUri = `file:///D:/test/lsp-${id}.wcl.avt`;
    const viewUri = `file:///D:/test/lsp-${id}.html.avt`;
    const logicDoc = TextDocument.create(logicUri, 'typescript', 1, classText);
    const viewDoc = TextDocument.create(viewUri, 'Aventus HTML', 1, viewText);
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        getAvoidParsingTags: () => [], getWebComponentDefinition: () => null,
        tsFiles: {}, scssFiles: {},
    };
    const logicFile = { uri: logicUri, versionInternal: 1, documentUser: logicDoc, documentInternal: logicDoc };
    const parsedLogic = ParserTs.parse(logicFile, false, build);
    const logic = { file: logicFile, fileParsed: parsedLogic, componentClassName: 'Card', getComponentName: () => 'Card' };
    build.tsFiles[logicUri] = logic;
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
    const view = Object.create(AventusHTMLFile.prototype);
    view._file = { uri: viewUri, versionUser: 1, documentUser: viewDoc };
    view._build = build;
    Object.defineProperty(view, 'tsFile', { value: logic });
    Object.defineProperty(view, 'scssFile', { value: null });
    view.fileParsed = ParserHtml.parse(view, build);
    return { view, viewDoc, logicDoc, parsedLogic, service };
}

test('HTML method reference resolves to TypeScript declaration and documentation', async () => {
    const classText = 'export class Card {\n/** Submit form */\npublic submit(): void {}\n}';
    const viewText = '<button @click="submit">Send</button>';
    const { view, viewDoc, logicDoc, service } = fixture(viewText, classText);
    const position = viewDoc.positionAt(viewText.indexOf('submit') + 2);
    const definition = await service.onDefinition(view, position);
    assert.equal(definition?.[0]?.uri, logicDoc.uri);
    assert.equal(logicDoc.getText(definition[0].range), 'submit');
    const hover = await service.doHover(view, position);
    assert.match(hover?.contents?.value ?? '', /Submit form/);
});

test('HTML element alias resolves to TypeScript field', async () => {
    const classText = 'export class Card {\n/** A label */\npublic label: string = "ok";\n}';
    const viewText = '<span @element="label"></span>';
    const { view, viewDoc, logicDoc, service } = fixture(viewText, classText);
    const position = viewDoc.positionAt(viewText.indexOf('label') + 1);
    const definition = await service.onDefinition(view, position);
    assert.equal(logicDoc.getText(definition?.[0]?.range), 'label');
    const hover = await service.doHover(view, position);
    assert.match(hover?.contents?.value ?? '', /A label/);
});

test('HTML reference to absent class member has no TypeScript definition', async () => {
    const viewText = '<button @click="missing">Send</button>';
    const { view, viewDoc, service } = fixture(viewText, 'export class Card {}');
    const position = viewDoc.positionAt(viewText.indexOf('missing') + 1);
    assert.deepEqual(await service.onDefinition(view, position), []);
});
