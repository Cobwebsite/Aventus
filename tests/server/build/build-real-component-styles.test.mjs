import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { AventusWebSCSSFile }, { InternalAventusFile }, { GenericServer },
    { DependencyManager }, { AventusPackageFile }, { HttpServer },
    { AventusSCSSLanguageService }, { ParserTs }, { AventusWebcomponentCompiler }] = await loadServerModules([
    'project/Build.ts', 'language-services/scss/File.ts', 'files/AventusFile.ts',
    'GenericServer.ts', 'project/DependencyManager.ts', 'language-services/ts/package/File.ts',
    'live-server/HttpServer.ts', 'language-services/scss/LanguageService.ts',
    'language-services/ts/parser/ParserTs.ts', 'language-services/ts/component/compiler/compiler.ts',
]);

test('build emits a truly compiled component style beside real global SCSS, then replaces both on rebuild', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-real-component-style-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const oldServer = GenericServer.instance;
    const oldDependencies = DependencyManager.instance;
    const oldHttp = HttpServer.getInstance;
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 4,
        connection: { delayBetweenBuild: () => 0, sendNotification() {}, sendDiagnostics() {} },
    };
    DependencyManager.instance = { getPath: () => root };
    HttpServer.getInstance = () => ({ updateGlobalCSS() {} });
    t.after(() => {
        GenericServer.instance = oldServer;
        DependencyManager.instance = oldDependencies;
        HttpServer.getInstance = oldHttp;
    });

    const main = join(root, 'dist', 'main.js');
    const pkg = join(root, 'dist', 'Demo.package.avt');
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    build.initDone = false;
    build._allowBuild = true;
    build.buildConfig = {
        fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0', rawDependencies: {}, componentPrefix: 'demo',
        compile: [{ output: [{ '@default': { path: main } }], package: [pkg],
            outputNpm: { path: [], npmName: '', live: false } }],
    };
    build.project = { getConfig: () => ({ aliases: {} }) };
    build.namespaces = [];
    build.dependencyNeedUris = [];
    build.dependencyFullUris = [];
    build.getNamespace = () => '';
    build.getNamespaceForUri = () => '';
    build.getNpmReplacementName = () => '';
    build.getComponentPrefix = () => 'demo';
    build.getWebComponentDefinitionFile = () => null;
    build.getWebComponentTagDependency = () => null;
    build.addNamespace = () => {};
    build.noNamespaceUri = {};
    build.wcFiles = {};
    build.tsFiles = {};
    build.scssFiles = {};
    build.htmlFiles = {};
    build.i18nComponentsFiles = {};
    build.globalComponentSCSSFiles = {};
    build.diagnostics = new Map();
    build.scssLanguageService = new AventusSCSSLanguageService(build);
    build.tsLanguageService = { doValidation: () => [] };
    build.htmlLanguageService = { getInternalTagUri: () => null };
    build.npmBuilder = { compile: async () => ({ result: '', errors: [] }), unregister() {} };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };

    const base = 'file:///D:/round88/card';
    const logicUri = `${base}.wcl.avt`;
    const styleUri = `${base}.wcs.avt`;
    const globalUri = 'file:///D:/round88/@theme.wcs.avt';
    const logicDoc = TextDocument.create(logicUri, 'typescript', 1, '@TagName("demo-card") export class Card {}');
    const logicFile = { uri: logicUri, versionInternal: 1, documentUser: logicDoc, documentInternal: logicDoc };
    const parsed = ParserTs.parse(logicFile, false, build);
    parsed.classes.Card.implements.push('Aventus.DefaultComponent');
    const logical = { file: logicFile, fileParsed: parsed, build, viewMethodName: '__view', resetViewClassInfoDep() {} };
    const componentStyle = new AventusWebSCSSFile(new InternalAventusFile(
        TextDocument.create(styleUri, 'scss', 1, '.card { color: red; }')), build);
    const globalStyle = new AventusWebSCSSFile(new InternalAventusFile(
        TextDocument.create(globalUri, 'scss', 1, ':root { --brand: blue; }')), build);
    build.scssFiles[styleUri] = componentStyle;
    build.scssFiles[globalUri] = globalStyle;
    build.globalComponentSCSSFiles[globalUri] = globalStyle;
    await componentStyle.init();
    await globalStyle.init();
    build.initDone = true;
    build.buildOrderCompilationInfo = async () => ({
        toCompile: new AventusWebcomponentCompiler(logical, build).compile().result, libSrc: [], errors: [],
    });

    const inspect = async () => {
        await build.build();
        const packageFile = Object.create(AventusPackageFile.prototype);
        packageFile._file = { contentUser: readFileSync(pkg, 'utf8') };
        packageFile.version = { major: 0, minor: 0, patch: 0 };
        return { js: readFileSync(main, 'utf8'), styles: JSON.parse(packageFile.separeSection().scssTxt) };
    };
    const first = await inspect();
    assert.match(first.js, /class Card/);
    assert.match(first.js, /\.card\{color:red\}/);
    assert.match(first.js, /--brand:\s*blue/);
    assert.deepEqual(Object.keys(first.styles), ['@theme']);

    componentStyle.file._documentUser = TextDocument.create(styleUri, 'scss', 2, '.card { color: green; }');
    globalStyle.file._documentUser = TextDocument.create(globalUri, 'scss', 2, ':root { --brand: purple; }');
    await componentStyle.triggerSave();
    await globalStyle.triggerSave();
    const second = await inspect();
    assert.match(second.js, /\.card\{color:green\}/);
    assert.match(second.js, /--brand:\s*purple/);
    assert.doesNotMatch(second.js, /\.card\{color:red\}|--brand:\s*blue/);
    assert.deepEqual(Object.keys(second.styles), ['@theme']);
});
