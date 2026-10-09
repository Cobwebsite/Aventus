import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ParserHtml }, { AventusWebcomponentCompiler }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'language-services/html/parser/ParserHtml.ts',
    'language-services/ts/component/compiler/compiler.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('component compilation replaces edited view and style without stale output', () => {
    const base = `file:///D:/test/cross-edit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const logicUri = `${base}.wcl.avt`;
    const viewUri = `${base}.wcv.avt`;
    const styleUri = `${base}.wcs.avt`;
    const logicDocument = TextDocument.create(logicUri, 'typescript', 1, '@TagName("demo-card") export class Card {}');
    const logicFile = { uri: logicUri, versionInternal: 1, documentUser: logicDocument, documentInternal: logicDocument };
    const build = {
        module: 'Demo', namespaces: [], isCoreBuild: false, hasNpmOutput: false, hasStories: false,
        npmBuilder: { unregister() {} }, buildConfig: { componentPrefix: 'demo' },
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        wcFiles: {}, tsFiles: {}, scssFiles: {}, htmlFiles: {}, i18nComponentsFiles: {},
        tsLanguageService: { doValidation: () => [] }, addNamespace() {},
        getComponentPrefix: () => 'demo',
        getWebComponentDefinitionFile: () => null,
        getWebComponentTagDependency: () => null,
        htmlLanguageService: { getInternalTagUri: () => null },
    };
    const fileParsed = ParserTs.parse(logicFile, false, build);
    fileParsed.classes.Card.implements.push('Aventus.DefaultComponent');
    const logical = { file: logicFile, fileParsed, build, viewMethodName: '__view', resetViewClassInfoDep() {} };
    const setParts = (viewText, styleText, version) => {
        const viewDocument = TextDocument.create(viewUri, 'Aventus HTML', version, viewText);
        const view = { file: { uri: viewUri, versionUser: version, documentUser: viewDocument }, tsFile: null, scssFile: null };
        build.htmlFiles[viewUri] = {
            fileParsed: ParserHtml.parse(view, { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } }),
            compiledVersion: version, slotsInfo: {},
        };
        build.scssFiles[styleUri] = { compileResult: styleText, compiledVersion: version };
    };
    const compile = () => new AventusWebcomponentCompiler(logical, build).compile().result.map(item => item.compiled).join('\n');

    setParts('<p>First content</p>', '.first{color:red}', 1);
    const before = compile();
    assert.match(before, /First content/);
    assert.match(before, /color:red/);

    setParts('<p>Second content</p>', '.second{color:blue}', 2);
    const after = compile();
    assert.match(after, /Second content/);
    assert.match(after, /color:blue/);
    assert.doesNotMatch(after, /First content|color:red/);
    assert.deepEqual(AventusWebcomponentCompiler.getVersion(logical, build), { ts: 1, scss: 2, html: 2, i18n: -1 });
});
