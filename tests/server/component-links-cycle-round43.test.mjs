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
const [, { AventusHTMLFile }, { AventusWebComponentLogicalFile }, { AventusWebSCSSFile }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/html/File.ts',
    'language-services/ts/component/File.ts',
    'language-services/scss/File.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('component output follows removal and restoration of both companion files', () => {
    const base = `file:///D:/test/link-cycle-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
        getComponentPrefix: () => 'demo', getWebComponentDefinitionFile: () => null,
        getWebComponentTagDependency: () => null,
        htmlLanguageService: { getInternalTagUri: () => null },
    };
    const fileParsed = ParserTs.parse(logicFile, false, build);
    fileParsed.classes.Card.implements.push('Aventus.DefaultComponent');
    const logical = { file: logicFile, fileParsed, build, viewMethodName: '__view', resetViewClassInfoDep() {} };
    const attachView = (source, version) => {
        const document = TextDocument.create(viewUri, 'Aventus HTML', version, source);
        const view = { file: { uri: viewUri, versionUser: version, documentUser: document }, tsFile: null, scssFile: null };
        build.htmlFiles[viewUri] = {
            fileParsed: ParserHtml.parse(view, { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } }),
            compiledVersion: version, slotsInfo: {},
        };
    };
    const attachStyle = (source, version) => {
        build.scssFiles[styleUri] = { compileResult: source, compiledVersion: version };
    };
    const compile = () => new AventusWebcomponentCompiler(logical, build).compile().result.map(item => item.compiled).join('\n');

    attachView('<p>Old view</p>', 1);
    attachStyle('.old{color:red}', 1);
    const initial = compile();
    assert.match(initial, /Old view/);
    assert.match(initial, /color:red/);

    delete build.htmlFiles[viewUri];
    const noView = compile();
    assert.doesNotMatch(noView, /Old view/);
    assert.match(noView, /color:red/);
    assert.deepEqual(AventusWebcomponentCompiler.getVersion(logical, build), { ts: 1, scss: 1, html: -1, i18n: -1 });

    delete build.scssFiles[styleUri];
    const bare = compile();
    assert.doesNotMatch(bare, /Old view|color:red/);
    assert.deepEqual(AventusWebcomponentCompiler.getVersion(logical, build), { ts: 1, scss: -1, html: -1, i18n: -1 });

    attachView('<p>New view</p>', 2);
    attachStyle('.new{color:blue}', 2);
    const restored = compile();
    assert.match(restored, /New view/);
    assert.match(restored, /color:blue/);
    assert.doesNotMatch(restored, /Old view|color:red/);
    assert.deepEqual(AventusWebcomponentCompiler.getVersion(logical, build), { ts: 1, scss: 2, html: 2, i18n: -1 });
});

test('view navigation follows companion registration and delegates rename to current logic', async () => {
    const base = `file:///D:/test/view-navigation-${Date.now()}`;
    const viewUri = `${base}.wcv.avt`;
    const logicUri = `${base}.wcl.avt`;
    const styleUri = `${base}.wcs.avt`;
    const file = { uri: viewUri, documentUser: TextDocument.create(viewUri, 'Aventus HTML', 1, '<div>{label}</div>') };
    const build = { tsFiles: {}, scssFiles: {} };
    const view = Object.create(AventusHTMLFile.prototype);
    view._file = file;
    view._build = build;
    assert.equal(view.tsFile, null);
    assert.equal(view.scssFile, null);
    assert.equal(await view.onRename(file, { line: 0, character: 7 }, 'heading'), null);

    const logical = Object.create(AventusWebComponentLogicalFile.prototype);
    const style = Object.create(AventusWebSCSSFile.prototype);
    const expected = { changes: { [viewUri]: [] } };
    let requests = 0;
    logical.doRename = async (position, name) => {
        requests++;
        assert.deepEqual(position, { line: 0, character: 7 });
        assert.equal(name, 'heading');
        return expected;
    };
    build.tsFiles[logicUri] = logical;
    build.scssFiles[styleUri] = style;
    assert.equal(view.tsFile, logical);
    assert.equal(view.scssFile, style);
    assert.equal(await view.onRename(file, { line: 0, character: 7 }, 'heading'), expected);
    assert.equal(requests, 1);

    delete build.tsFiles[logicUri];
    delete build.scssFiles[styleUri];
    assert.equal(view.tsFile, null);
    assert.equal(view.scssFile, null);
    assert.equal(await view.onRename(file, { line: 0, character: 7 }, 'heading'), null);
    assert.equal(requests, 1);
});
