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
let fixtureId = 0;

function fixture(source) {
    const uri = `file:///D:/test/compiler-${++fixtureId}.wcl.avt`;
    const document = TextDocument.create(uri, 'typescript', 1, source);
    const file = { uri, versionInternal: 1, documentUser: document, documentInternal: document };
    const build = {
        module: 'Demo', namespaces: [], isCoreBuild: false, hasNpmOutput: false, hasStories: false,
        npmBuilder: { unregister() {} }, buildConfig: { componentPrefix: 'demo' },
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        wcFiles: {}, tsFiles: {}, scssFiles: {}, htmlFiles: {}, i18nComponentsFiles: {},
        tsLanguageService: { doValidation: () => [] },
        addNamespace() {},
        getComponentPrefix: () => 'demo',
        getWebComponentDefinitionFile: () => null,
        getWebComponentTagDependency: () => null,
        htmlLanguageService: { getInternalTagUri: () => null },
    };
    const fileParsed = ParserTs.parse(file, false, build);
    const logical = { file, fileParsed, build, viewMethodName: '__view', resetViewClassInfoDep() {} };
    return { logical, build, fileParsed };
}

test('component compiler version combines logic, view, style and i18n versions', () => {
    const { logical, build } = fixture('export class Card {}');
    const logicUri = logical.file.uri;
    const viewUri = logicUri.replace('.wcl.avt', '.wcv.avt');
    const styleUri = logicUri.replace('.wcl.avt', '.wcs.avt');
    const i18nUri = logicUri.replace('.wcl.avt', '.i18n.avt');
    build.htmlFiles[viewUri] = { compiledVersion: 4 };
    build.scssFiles[styleUri] = { compiledVersion: 3 };
    build.i18nComponentsFiles[i18nUri] = { file: { versionUser: 5 } };
    assert.deepEqual(AventusWebcomponentCompiler.getVersion(logical, build), { ts: 1, scss: 3, html: 4, i18n: 5 });
    delete build.htmlFiles[viewUri];
    delete build.scssFiles[styleUri];
    delete build.i18nComponentsFiles[i18nUri];
    assert.deepEqual(AventusWebcomponentCompiler.getVersion(logical, build), { ts: 1, scss: -1, html: -1, i18n: -1 });
});

test('component compiler reports a diagnostic when no web component class exists', () => {
    const { logical, build } = fixture('export class Plain {}');
    const result = new AventusWebcomponentCompiler(logical, build).compile();
    assert.ok(result.diagnostics.some(item => item.message.includes("Can't found a web component class")));
});

test('component compiler emits script and tag for a minimal component', () => {
    const { logical, build, fileParsed } = fixture('@TagName("demo-card") export class Card {}');
    fileParsed.classes.Card.implements.push('Aventus.DefaultComponent');
    const result = new AventusWebcomponentCompiler(logical, build).compile();
    assert.equal(result.componentName, 'Card');
    assert.equal(result.result[0].tagName, 'demo-card');
    assert.ok(result.result.some(item => item.compiled.includes('Card')));
});

test('component compiler includes an attached view and stylesheet', () => {
    const { logical, build, fileParsed } = fixture('@TagName("demo-card") export class Card {}');
    fileParsed.classes.Card.implements.push('Aventus.DefaultComponent');
    const viewUri = logical.file.uri.replace('.wcl.avt', '.wcv.avt');
    const viewDoc = TextDocument.create(viewUri, 'Aventus HTML', 1, '<p class="card">Hello</p>');
    const viewFile = { file: { uri: viewUri, versionUser: 1, documentUser: viewDoc }, tsFile: null, scssFile: null };
    const htmlParsed = ParserHtml.parse(viewFile, { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } });
    build.htmlFiles[viewUri] = { fileParsed: htmlParsed, slotsInfo: {} };
    const styleUri = logical.file.uri.replace('.wcl.avt', '.wcs.avt');
    build.scssFiles[styleUri] = { compileResult: '.card{color:red}' };
    const result = new AventusWebcomponentCompiler(logical, build).compile();
    assert.equal(result.componentName, 'Card');
    const output = result.result.map(item => item.compiled).join('\n');
    assert.match(output, /Hello/);
    assert.match(output, /color:red/);
});

test('component compiler diagnoses an invalid tag name', () => {
    const { logical, build, fileParsed } = fixture('@TagName("BadName") export class Card {}');
    fileParsed.classes.Card.implements.push('Aventus.DefaultComponent');
    const result = new AventusWebcomponentCompiler(logical, build).compile();
    assert.ok(result.diagnostics.some(item => item.message.includes('tag name must be in lower case and have a - inside')));
});
