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

function compile(version, viewText) {
    const uri = 'file:///D:/round237/bound-editor.wcl.avt';
    const source = '@TagName("demo-bound-editor") export class BoundEditor { profile = { name: "" }; busy = false; }';
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
    parsed.classes.BoundEditor.implements.push('Aventus.DefaultComponent');
    const logical = { file, fileParsed: parsed, build, componentClassName: 'BoundEditor', viewMethodName: '__view', resetViewClassInfoDep() {} };
    const viewFile = { file: { uri: viewUri, versionUser: version, documentUser: viewDoc }, tsFile: logical, scssFile: null };
    const htmlParsed = ParserHtml.parse(viewFile, build);
    build.htmlFiles[viewUri] = { fileParsed: htmlParsed, slotsInfo: {} };
    const result = new AventusWebcomponentCompiler(logical, build).compile();
    return { htmlParsed, result, output: result.result.map(item => item.compiled).join('\n') };
}

test('compiled view actions replace binding events and remove obsolete injection callbacks', () => {
    const first = compile(1, '<input @bind_input:value="profile.name" :disabled="busy">');
    assert.deepEqual(first.htmlParsed.errors, []);
    assert.deepEqual(first.result.diagnostics, []);
    assert.equal(first.htmlParsed.bindings.length, 1);
    assert.equal(first.htmlParsed.injections.length, 1);
    assert.match(first.output, /"injectionName": "disabled"/);
    assert.match(first.output, /"eventNames": \[\s*"input"/);
    assert.match(first.output, /"inject": \(c\) => c\.comp\.__view0\(\)/);
    assert.match(first.output, /"extract": \(c, v\) => c\.comp\.__view1\(v\)/);

    const second = compile(2, '<textarea @bind_change:value="profile.name"></textarea>');
    assert.deepEqual(second.htmlParsed.errors, []);
    assert.deepEqual(second.result.diagnostics, []);
    assert.equal(second.htmlParsed.bindings.length, 1);
    assert.deepEqual(second.htmlParsed.injections, []);
    assert.match(second.output, /"eventNames": \[\s*"change"/);
    assert.doesNotMatch(second.output, /"injectionName": "disabled"/);
    assert.match(second.output, /"extract": \(c, v\) => c\.comp\.__view1\(v\)/);

    const third = compile(3, '<p>plain text</p>');
    assert.deepEqual(third.htmlParsed.errors, []);
    assert.deepEqual(third.result.diagnostics, []);
    assert.deepEqual(third.htmlParsed.bindings, []);
    assert.deepEqual(third.htmlParsed.injections, []);
    assert.doesNotMatch(third.output, /"bindings"|"injection"|__view\d+/);
});
