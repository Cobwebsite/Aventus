import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ParserHtml }, { AventusHTMLLanguageService }, { AventusHTMLFile }, { AventusWebComponentLogicalFile }, { AventusWebSCSSFile }, { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/LanguageService.ts',
    'language-services/html/File.ts',
    'language-services/ts/component/File.ts',
    'language-services/scss/File.ts',
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('view navigation and rename follow companion removal and restoration without stale targets', async () => {
    const base = `file:///D:/test/navigation-lifecycle-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
    build.htmlLanguageService = service;
    const scssService = new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });

    const view = Object.create(AventusHTMLFile.prototype);
    view._file = { uri: viewUri, versionUser: 1, documentUser: viewDocument };
    view._build = build;
    const methodPosition = viewDocument.positionAt(viewText.indexOf('submit') + 2);
    const classPosition = viewDocument.positionAt(viewText.indexOf('card') + 2);
    const attachLogic = (source, version) => {
        const document = TextDocument.create(logicUri, 'typescript', version, source);
        const logic = Object.create(AventusWebComponentLogicalFile.prototype);
        logic._file = { uri: logicUri, versionInternal: version, documentUser: document, documentInternal: document };
        logic._build = build;
        logic.fileParsed = ParserTs.parse(logic.file, false, build);
        Object.defineProperty(logic, 'componentClassName', { value: 'Card' });
        logic.getComponentName = () => 'Card';
        logic.doDefinition = async () => null;
        logic.doRename = async () => null;
        build.tsFiles[logicUri] = logic;
        return { logic, document };
    };
    const attachStyle = (source, version) => {
        const document = TextDocument.create(styleUri, 'scss', version, source);
        const style = Object.create(AventusWebSCSSFile.prototype);
        style._file = { uri: styleUri, documentUser: document };
        Object.defineProperty(style, 'rules', { value: scssService.getRules({ documentUser: document }) });
        build.scssFiles[styleUri] = style;
        ParserHtml.refreshStyle(view, build);
        return document;
    };

    const firstLogic = attachLogic('export class Card { public submit(): void {} }', 1);
    view.fileParsed = ParserHtml.parse(view, build);
    const firstStyle = attachStyle('.card { color: red; }', 1);
    const firstMethod = await view.onDefinition(view.file, methodPosition);
    const firstClass = await view.onDefinition(view.file, classPosition);
    assert.equal(firstMethod?.[0]?.uri, logicUri);
    assert.equal(firstLogic.document.getText(firstMethod[0].range), 'submit');
    assert.equal(firstClass?.[0]?.uri, styleUri);
    assert.equal(firstStyle.getText(firstClass[0].range), '.card');

    const expectedEdit = { changes: { [logicUri]: [{ range: firstMethod[0].range, newText: 'send' }] } };
    let renameCalls = 0;
    firstLogic.logic.doRename = async (position, name) => {
        renameCalls++;
        assert.deepEqual(position, methodPosition);
        assert.equal(name, 'send');
        return expectedEdit;
    };
    assert.equal(await view.onRename(view.file, methodPosition, 'send'), expectedEdit);

    delete build.tsFiles[logicUri];
    assert.deepEqual(await view.onDefinition(view.file, methodPosition), []);
    assert.equal(await view.onRename(view.file, methodPosition, 'send'), null);
    assert.equal(renameCalls, 1);
    assert.equal((await view.onDefinition(view.file, classPosition))?.[0]?.uri, styleUri);

    delete build.scssFiles[styleUri];
    ParserHtml.refreshStyle(view, build);
    assert.deepEqual(await view.onDefinition(view.file, classPosition), []);

    const replacementLogic = attachLogic('export class Card { public submit(): void { return; } }', 2);
    const replacementStyle = attachStyle('.card { color: blue; }', 2);
    const newMethod = await view.onDefinition(view.file, methodPosition);
    const newClass = await view.onDefinition(view.file, classPosition);
    assert.equal(replacementLogic.document.getText(newMethod[0].range), 'submit');
    assert.equal(replacementStyle.getText(newClass[0].range), '.card');
    assert.notEqual(view.tsFile, firstLogic.logic);
});
