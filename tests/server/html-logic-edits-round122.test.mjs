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

test('HTML method and property definitions follow view and TypeScript edits without stale targets', async () => {
    const base = `file:///D:/test/html-logic-edits-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const logicUri = `${base}.wcl.avt`;
    const viewUri = `${base}.wcv.avt`;
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        getAvoidParsingTags: () => [], getWebComponentDefinition: () => null,
        tsFiles: {}, scssFiles: {},
    };
    const logicFile = { uri: logicUri, versionInternal: 1 };
    const logic = { file: logicFile, componentClassName: 'Card', getComponentName: () => 'Card' };
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
    view._file = { uri: viewUri, versionUser: 1 };
    view._build = build;
    Object.defineProperty(view, 'tsFile', { value: logic });
    Object.defineProperty(view, 'scssFile', { value: null });

    const update = (viewText, classText, version) => {
        logicFile.versionInternal = version;
        logicFile.documentUser = TextDocument.create(logicUri, 'typescript', version, classText);
        logicFile.documentInternal = logicFile.documentUser;
        logic.fileParsed = ParserTs.parse(logicFile, false, build);
        view.file.versionUser = version;
        view.file.documentUser = TextDocument.create(viewUri, 'Aventus HTML', version, viewText);
        view.fileParsed = ParserHtml.parse(view, build);
    };
    const resolve = async (method, occurrence = 0) => {
        const doc = view.file.documentUser;
        let offset = -1;
        for (let i = 0; i <= occurrence; i++) offset = doc.getText().indexOf(method, offset + 1);
        assert.ok(offset >= 0);
        const position = doc.positionAt(offset + 1);
        return {
            definition: await service.onDefinition(view, position),
            hover: await service.doHover(view, position),
        };
    };

    update('<button @click="submit">A</button>\r\n<button @click="submit">B</button>',
        'export class Card {\n/** First handler */\npublic submit(): void {}\n}', 1);
    for (let occurrence = 0; occurrence < 2; occurrence++) {
        const { definition, hover } = await resolve('submit', occurrence);
        assert.equal(definition?.[0]?.uri, logicUri);
        assert.equal(logicFile.documentUser.getText(definition[0].range), 'submit');
        assert.match(hover?.contents?.value ?? '', /First handler/);
    }

    update('<button @click="send">A</button>\r\n<button @click="submit">B</button>',
        'export class Card {\n/** Second handler */\npublic send(): void {}\n}', 2);
    const changed = await resolve('send');
    assert.equal(logicFile.documentUser.getText(changed.definition?.[0]?.range), 'send');
    assert.match(changed.hover?.contents?.value ?? '', /Second handler/);
    assert.deepEqual((await resolve('submit')).definition, []);

    update('<button @click="send">A</button>\r\n<button @click="submit">B</button>',
        'export class Card {\n/** Restored handler */\npublic submit(): void {}\n}', 3);
    assert.deepEqual((await resolve('send')).definition, []);
    const restored = await resolve('submit');
    assert.equal(logicFile.documentUser.getText(restored.definition?.[0]?.range), 'submit');
    assert.match(restored.hover?.contents?.value ?? '', /Restored handler/);

    update('<span @element="label"></span><button @click="submit">B</button>',
        'export class Card {\n/** Current label */\npublic label: string = "new";\npublic submit(): void {}\n}', 4);
    const property = await resolve('label');
    assert.equal(logicFile.documentUser.getText(property.definition?.[0]?.range), 'label');
    assert.match(property.hover?.contents?.value ?? '', /Current label/);
    update('<span @element="label"></span>', 'export class Card { public other: string = "new"; }', 5);
    assert.deepEqual((await resolve('label')).definition, []);
});
