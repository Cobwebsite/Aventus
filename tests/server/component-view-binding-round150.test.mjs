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

function compile(version, viewText) {
    const uri = 'file:///D:/round150/bound-card.wcl.avt';
    const source = '@TagName("demo-bound-card") export class BoundCard { model = { name: "" }; saving = false; }';
    const document = TextDocument.create(uri, 'typescript', version, source);
    const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
    const viewUri = uri.replace('.wcl.avt', '.wcv.avt');
    const viewDoc = TextDocument.create(viewUri, 'Aventus HTML', version, viewText);
    const build = {
        module: 'Demo', namespaces: [], isCoreBuild: false, hasNpmOutput: false, hasStories: false,
        npmBuilder: { unregister() {} }, buildConfig: { componentPrefix: 'demo' },
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        wcFiles: {}, tsFiles: {}, scssFiles: {}, htmlFiles: {}, i18nComponentsFiles: {},
        tsLanguageService: { doValidation: () => [] }, addNamespace() {},
        getComponentPrefix: () => 'demo', getWebComponentDefinitionFile: () => null,
        getAvoidParsingTags: () => [],
        getWebComponentDefinition: () => null, getWebComponentTagDependency: () => null,
        htmlLanguageService: { getInternalTagUri: () => null, getClassByTag: () => null },
    };
    const parsed = ParserTs.parse(file, false, build);
    parsed.classes.BoundCard.implements.push('Aventus.DefaultComponent');
    const logical = { file, fileParsed: parsed, build, componentClassName: 'BoundCard', viewMethodName: '__view', resetViewClassInfoDep() {} };
    const viewFile = { file: { uri: viewUri, versionUser: version, documentUser: viewDoc }, tsFile: logical, scssFile: null };
    const htmlParsed = ParserHtml.parse(viewFile, build);
    build.htmlFiles[viewUri] = { fileParsed: htmlParsed, slotsInfo: {} };
    return { parsed: htmlParsed, result: new AventusWebcomponentCompiler(logical, build).compile() };
}

test('le compilateur transporte les actions d’injection et de binding de la vue vers le composant', () => {
    const { parsed, result } = compile(1, '<input @bind_input:value="model.name" :disabled="saving">');
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.bindings.length, 1);
    assert.equal(parsed.injections.length, 1);
    assert.deepEqual(result.diagnostics, []);
    const output = result.result.map(item => item.compiled).join('\n');
    assert.equal(parsed.bindings[0].injectTsTxt, 'model.name');
    assert.equal(parsed.injections[0].injectTsTxt, 'saving');
    assert.match(output, /c\.comp\.__view0\(\)/);
    assert.match(output, /c\.comp\.__view1\(v\)/);
    assert.match(output, /c\.comp\.__view2\(\)/);
    assert.match(output, /bindings/);
    assert.match(output, /injection/);
});

test('une recompilation après modification de la vue conserve les actions et actualise les expressions analysées', () => {
    compile(2, '<input @bind_input:value="model.name" :disabled="saving">');
    const { parsed, result } = compile(3, '<input @bind_input:value="model.title" :disabled="busy">');
    assert.deepEqual(result.diagnostics, []);
    const output = result.result.map(item => item.compiled).join('\n');
    assert.equal(parsed.bindings[0].injectTsTxt, 'model.title');
    assert.equal(parsed.injections[0].injectTsTxt, 'busy');
    assert.match(output, /c\.comp\.__view0\(\)/);
    assert.match(output, /c\.comp\.__view1\(v\)/);
    assert.match(output, /c\.comp\.__view2\(\)/);
});
