import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ParserHtml }, { AventusHTMLLanguageService }, { AventusHTMLFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/LanguageService.ts',
    'language-services/html/File.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('HTML tag definitions follow component class and tag revisions without stale targets', async () => {
    const base = `file:///D:/test/html-tag-class-round201-${process.pid}-${Math.random().toString(36).slice(2)}`;
    const logicUri = `${base}.wcl.avt`;
    const viewUri = `${base}.wcv.avt`;
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
    service.internalDefinitionFiles = {};
    service.internalDocumentationReverse = {};
    service.internalTagUri = {};
    service._allowRebuildDefinition = true;
    service.rebuildDefinition();
    build.htmlLanguageService = service;
    const logic = { file: { uri: logicUri }, componentClassName: 'FirstCard', getComponentName() { return this.componentClassName; } };
    build.tsFiles[logicUri] = logic;
    const view = Object.create(AventusHTMLFile.prototype);
    view._file = { uri: viewUri, versionUser: 0 };
    view._build = build;
    Object.defineProperty(view, 'tsFile', { value: logic });
    Object.defineProperty(view, 'scssFile', { value: null });

    const update = (className, tagName, viewText, version) => {
        const source = `export class ${className} {}`;
        const doc = TextDocument.create(logicUri, 'typescript', version, source);
        logic.componentClassName = className;
        logic.file = { uri: logicUri, versionInternal: version, documentUser: doc, documentInternal: doc };
        logic.fileParsed = ParserTs.parse(logic.file, false, build);
        service.removeInternalDefinition(logicUri);
        service.addInternalDefinition(logicUri, {
            [tagName]: { name: tagName, class: className, description: '', attributes: {} },
        }, logic);
        view.file.versionUser = version;
        view.file.documentUser = TextDocument.create(viewUri, 'Aventus HTML', version, viewText);
        view.fileParsed = ParserHtml.parse(view, build);
    };
    const targets = async (tagName) => {
        const doc = view.file.documentUser;
        const source = doc.getText();
        const matches = [...source.matchAll(new RegExp(tagName, 'g'))];
        assert.ok(matches.length > 0);
        return Promise.all(matches.map(async match => {
            const links = await service.onDefinition(view, doc.positionAt(match.index + 2));
            return links?.map(link => ({ uri: link.uri, text: logic.file.documentUser.getText(link.range) })) ?? [];
        }));
    };

    update('FirstCard', 'demo-first', '<demo-first></demo-first>\n<demo-first/>', 1);
    for (const target of await targets('demo-first')) assert.deepEqual(target, [{ uri: logicUri, text: 'FirstCard' }]);

    update('SecondCard', 'demo-second', '<demo-first></demo-first>\n<demo-second></demo-second>', 2);
    assert.deepEqual(await targets('demo-first'), [[], []]);
    for (const target of await targets('demo-second')) assert.deepEqual(target, [{ uri: logicUri, text: 'SecondCard' }]);

    update('ThirdCard', 'demo-third', '<demo-third></demo-third>', 3);
    for (const target of await targets('demo-third')) assert.deepEqual(target, [{ uri: logicUri, text: 'ThirdCard' }]);
    assert.equal(service.getInternalDefinition('demo-first'), undefined);
    assert.equal(service.getInternalDefinition('demo-second'), undefined);
});
