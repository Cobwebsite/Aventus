import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ParserHtml }, { AventusWebcomponentCompiler }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'language-services/html/parser/ParserHtml.ts',
    'language-services/ts/component/compiler/compiler.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('component compiler retires deleted view/style and uses fresh regions when they return', () => {
    const base = 'file:///D:/round186/region-lifecycle';
    const logicUri = `${base}.wcl.avt`;
    const viewUri = `${base}.wcv.avt`;
    const styleUri = `${base}.wcs.avt`;
    const build = {
        module: 'Demo', namespaces: [], isCoreBuild: false, hasNpmOutput: false, hasStories: false,
        npmBuilder: { unregister() {} }, buildConfig: { componentPrefix: 'demo' },
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        wcFiles: {}, tsFiles: {}, scssFiles: {}, htmlFiles: {}, i18nComponentsFiles: {},
        tsLanguageService: { doValidation: () => [] }, addNamespace() {},
        getComponentPrefix: () => 'demo', getWebComponentDefinitionFile: () => null,
        getWebComponentTagDependency: () => null, getAvoidParsingTags: () => [],
        htmlLanguageService: { getInternalTagUri: () => null, getClassByTag: () => null },
    };
    const source = (title) => `@TagName("demo-card") export class Card { title = "${title}"; }`;
    const logicDoc = TextDocument.create(logicUri, 'typescript', 1, source('FirstTitle'));
    const logicFile = { uri: logicUri, versionInternal: 1, documentUser: logicDoc, documentInternal: logicDoc };
    const logical = { file: logicFile, fileParsed: null, build, viewMethodName: '__view', resetViewClassInfoDep() {} };
    const setLogic = (version, title) => {
        const document = TextDocument.create(logicUri, 'typescript', version, source(title));
        logicFile.versionInternal = version;
        logicFile.documentUser = document;
        logicFile.documentInternal = document;
        logical.fileParsed = ParserTs.parse(logicFile, false, build);
        logical.fileParsed.classes.Card.implements.push('Aventus.DefaultComponent');
    };
    const setView = (version, content) => {
        const document = TextDocument.create(viewUri, 'Aventus HTML', version, content);
        const view = { file: { uri: viewUri, versionUser: version, documentUser: document }, tsFile: logical, scssFile: null };
        build.htmlFiles[viewUri] = { fileParsed: ParserHtml.parse(view, build), compiledVersion: version, slotsInfo: {} };
    };
    const setStyle = (version, content) => {
        build.scssFiles[styleUri] = { compileResult: content, compiledVersion: version };
    };
    const compile = () => {
        const result = new AventusWebcomponentCompiler(logical, build).compile();
        assert.deepEqual(result.diagnostics, []);
        return result.result.map(item => item.compiled).join('\n');
    };

    setLogic(1, 'FirstTitle');
    setView(1, '<p>FirstView</p>');
    setStyle(1, '.first{color:red}');
    const first = compile();
    assert.match(first, /FirstTitle/);
    assert.match(first, /FirstView/);
    assert.match(first, /color:red/);

    delete build.htmlFiles[viewUri];
    delete build.scssFiles[styleUri];
    const withoutRegions = compile();
    assert.doesNotMatch(withoutRegions, /FirstView|color:red/);
    assert.deepEqual(AventusWebcomponentCompiler.getVersion(logical, build), { ts: 1, scss: -1, html: -1, i18n: -1 });

    setView(3, '<p>ThirdView</p>');
    setStyle(3, '.third{color:green}');
    const restored = compile();
    assert.match(restored, /ThirdView|color:green/);
    assert.doesNotMatch(restored, /FirstView|color:red/);
    assert.deepEqual(AventusWebcomponentCompiler.getVersion(logical, build), { ts: 1, scss: 3, html: 3, i18n: -1 });
});
