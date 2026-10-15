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
GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };

test('parsed component renews logic, view, style and companion declaration together', () => {
    const base = 'file:///D:/round211/combined';
    const logicUri = `${base}.wcl.avt`;
    const viewUri = `${base}.wcv.avt`;
    const styleUri = `${base}.wcs.avt`;
    const build = {
        module: 'Demo', namespaces: [], isCoreBuild: false, hasNpmOutput: false, hasStories: false,
        npmBuilder: { unregister() {} }, buildConfig: { componentPrefix: 'demo' },
        externalPackageInformation: { getNpmUri: () => null },
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        wcFiles: {}, tsFiles: {}, scssFiles: {}, htmlFiles: {}, i18nComponentsFiles: {},
        tsLanguageService: { doValidation: () => [] }, addNamespace() {},
        getComponentPrefix: () => 'demo', getWebComponentDefinitionFile: () => null,
        getWebComponentTagDependency: () => null, getAvoidParsingTags: () => [],
        htmlLanguageService: { getInternalTagUri: () => null, getClassByTag: () => null },
    };
    const logical = { file: null, fileParsed: null, build, viewMethodName: '__view', resetViewClassInfoDep() {} };
    const revisions = [
        { version: 1, helper: 'FirstHelper', value: 'FirstValue', view: 'FirstView', color: 'red' },
        { version: 2, helper: 'SecondHelper', value: 'SecondValue', view: 'SecondView', color: 'blue' },
        { version: 3, helper: 'ThirdHelper', value: 'ThirdValue', view: 'ThirdView', color: 'green' },
    ];
    for (const current of revisions) {
        const { version, helper, value, view, color } = current;
        const source = `export class ${helper} { static value = "${value}"; }\n` +
            `@TagName("demo-card") export class Card implements Aventus.DefaultComponent { title = "${value}"; }`;
        const document = TextDocument.create(logicUri, 'typescript', version, source);
        const file = { uri: logicUri, versionInternal: version, documentUser: document, documentInternal: document };
        logical.file = file;
        logical.fileParsed = ParserTs.parse(file, false, build);
        assert.ok(logical.fileParsed.classes.Card.implements.includes('Aventus.DefaultComponent'));
        const htmlDocument = TextDocument.create(viewUri, 'Aventus HTML', version, `<p>${view}</p>`);
        const html = { file: { uri: viewUri, versionUser: version, documentUser: htmlDocument }, tsFile: logical, scssFile: null };
        build.htmlFiles[viewUri] = { fileParsed: ParserHtml.parse(html, build), compiledVersion: version, slotsInfo: {} };
        build.scssFiles[styleUri] = { compileResult: `.card{color:${color}}`, compiledVersion: version };

        const result = new AventusWebcomponentCompiler(logical, build).compile();
        assert.deepEqual(result.diagnostics, []);
        const output = result.result.map(item => item.compiled).join('\n');
        assert.match(output, new RegExp(helper));
        assert.match(output, new RegExp(value));
        assert.match(output, new RegExp(view));
        assert.match(output, new RegExp(`color:${color}`));
        for (const previous of revisions.filter(item => item.version < version)) {
            for (const stale of [previous.helper, previous.value, previous.view, `color:${previous.color}`]) {
                assert.doesNotMatch(output, new RegExp(stale));
            }
        }
        assert.deepEqual(AventusWebcomponentCompiler.getVersion(logical, build),
            { ts: version, scss: version, html: version, i18n: -1 });
    }
});
