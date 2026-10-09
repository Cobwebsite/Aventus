import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ParserHtml }, { AventusWebcomponentCompiler }, { AventusWebComponentSingleFile }, { InternalAventusFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'language-services/html/parser/ParserHtml.ts',
    'language-services/ts/component/compiler/compiler.ts',
    'language-services/ts/component/SingleFile.ts',
    'files/AventusFile.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

function compileParts(parts, revision) {
    const base = `file:///D:/test/format-${revision}`;
    const logicUri = `${base}.wcl.avt`;
    const viewUri = `${base}.wcv.avt`;
    const styleUri = `${base}.wcs.avt`;
    const document = TextDocument.create(logicUri, 'typescript', revision, parts.scriptText);
    const file = { uri: logicUri, versionInternal: revision, documentUser: document, documentInternal: document };
    const build = {
        module: 'Demo', namespaces: [], isCoreBuild: false, hasNpmOutput: false, hasStories: false,
        npmBuilder: { unregister() {} }, buildConfig: { componentPrefix: 'demo' },
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        wcFiles: {}, tsFiles: {}, scssFiles: {}, htmlFiles: {}, i18nComponentsFiles: {},
        tsLanguageService: { doValidation: () => [] }, addNamespace() {},
        getComponentPrefix: () => 'demo', getWebComponentDefinitionFile: () => null,
        getWebComponentTagDependency: () => null,
        htmlLanguageService: { getInternalTagUri: () => null },
    };
    const fileParsed = ParserTs.parse(file, false, build);
    fileParsed.classes.Card.implements.push('Aventus.DefaultComponent');
    const logical = { file, fileParsed, build, viewMethodName: '__view', resetViewClassInfoDep() {} };
    const viewDocument = TextDocument.create(viewUri, 'Aventus HTML', revision, parts.htmlText);
    const view = { file: { uri: viewUri, versionUser: revision, documentUser: viewDocument }, tsFile: null, scssFile: null };
    build.htmlFiles[viewUri] = {
        fileParsed: ParserHtml.parse(view, { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } }),
        compiledVersion: revision, slotsInfo: {},
    };
    build.scssFiles[styleUri] = { compileResult: parts.cssText, compiledVersion: revision };
    return new AventusWebcomponentCompiler(logical, build).compile().result.map(item => item.compiled).join('\n');
}

test('single-file regions and separated files produce equal compiler output across a view/style/script edit', () => {
    const versions = [
        {
            scriptText: '@TagName("demo-card") export class Card { title = "First"; }',
            htmlText: '<p>First view</p>', cssText: '.card{color:red}',
        },
        {
            scriptText: '@TagName("demo-card") export class Card { title = "Second"; }',
            htmlText: '<p>Second view</p>', cssText: '.card{color:blue}',
        },
    ];
    const outputs = [];
    for (const [index, parts] of versions.entries()) {
        const source = `<script>${parts.scriptText}</script>\n<template>${parts.htmlText}</template>\n<style>${parts.cssText}</style>`;
        const extracted = AventusWebComponentSingleFile.getRegion({ contentInternal: source });
        assert.deepEqual(extracted, parts);
        const fromSingle = compileParts(extracted, index + 1);
        const fromSeparate = compileParts(parts, index + 1);
        assert.equal(fromSingle, fromSeparate);
        outputs.push(fromSingle);
    }
    assert.match(outputs[0], /First view/);
    assert.match(outputs[0], /color:red/);
    assert.match(outputs[1], /Second view/);
    assert.match(outputs[1], /color:blue/);
    assert.doesNotMatch(outputs[1], /First view|color:red/);
});

test('single-file initial registration exposes script/style but leaves template unattached', () => {
    const uri = 'file:///D:/test/component-format-initial.wc.avt';
    const text = '<script>@TagName("demo-card") export class Card {}</script><template><p>Visible</p></template><style>.card{color:red}</style>';
    const file = new InternalAventusFile(TextDocument.create(uri, 'Aventus WebComponent', 1, text));
    const build = {
        tsFiles: {}, wcFiles: {}, getNamespace: () => '', getComponentPrefix: () => 'demo',
        getNamespaceForUri: () => '', addNamespace() {},
        npmBuilder: { unregister() {} }, module: 'Demo', namespaces: [], isCoreBuild: false,
        hasNpmOutput: false, hasStories: false, buildConfig: { componentPrefix: 'demo' },
        getNpmReplacementName: () => '',
        tsLanguageService: { addFile() {}, doValidation: () => [] },
    };
    const single = new AventusWebComponentSingleFile(file, build);
    build.wcFiles[uri] = single;
    assert.equal(single.logic.file.uri, uri);
    assert.ok(single.style);
    assert.equal(single.view, undefined);
});
