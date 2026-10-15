import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { AventusWebcomponentCompiler }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'language-services/ts/component/compiler/compiler.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };

test('component compiler keeps a declared component through a real source revision', () => {
    const uri = 'file:///D:/round187/reparsed.wcl.avt';
    const build = {
        module: 'Demo', namespaces: [], isCoreBuild: false, hasNpmOutput: false, hasStories: false,
        npmBuilder: { unregister() {} }, buildConfig: { componentPrefix: 'demo', nodeModulesDir: 'D:/Aventus/Aventus/node_modules' },
        externalPackageInformation: { getNpmUri: () => null },
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        wcFiles: {}, tsFiles: {}, scssFiles: {}, htmlFiles: {}, i18nComponentsFiles: {},
        tsLanguageService: { doValidation: () => [] }, addNamespace() {},
        getComponentPrefix: () => 'demo', getWebComponentDefinitionFile: () => null,
        getWebComponentTagDependency: () => null, getAvoidParsingTags: () => [],
        htmlLanguageService: { getInternalTagUri: () => null, getClassByTag: () => null },
    };
    const source = title => `@TagName("demo-card") export class Card implements Aventus.DefaultComponent { @Attribute() title: string = "${title}"; }`;
    const logical = { file: null, fileParsed: null, build, viewMethodName: '__view', resetViewClassInfoDep() {} };
    for (const [version, title] of [[1, 'FirstTitle'], [2, 'SecondTitle']]) {
        const document = TextDocument.create(uri, 'typescript', version, source(title));
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        logical.file = file;
        logical.fileParsed = ParserTs.parse(file, false, build);
        assert.ok(logical.fileParsed.classes.Card.implements.includes('Aventus.DefaultComponent'));
        const result = new AventusWebcomponentCompiler(logical, build).compile();
        assert.deepEqual(result.diagnostics, []);
        assert.match(result.result.map(item => item.compiled).join('\n'), new RegExp(title));
    }
});
