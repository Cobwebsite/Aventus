import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { DependencyManager }, { ParserTs },
    { AventusWebcomponentCompiler }, { AventusPackageFile }, { AventusSCSSLanguageService }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
    'language-services/ts/parser/ParserTs.ts',
    'language-services/ts/component/compiler/compiler.ts',
    'language-services/ts/package/File.ts',
    'language-services/scss/LanguageService.ts',
]);

test('a full build preserves the compilation order of two parsed web components in JS and package', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-two-components-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const oldServer = GenericServer.instance;
    const oldDependencies = DependencyManager.instance;
    const notifications = [];
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 4,
        connection: { delayBetweenBuild: () => 0,
            sendNotification: (name, args) => notifications.push([name, args]), sendDiagnostics() {} },
    };
    DependencyManager.instance = { getPath: () => root };
    t.after(() => { GenericServer.instance = oldServer; DependencyManager.instance = oldDependencies; });

    const main = join(root, 'dist', 'main.js');
    const pkg = join(root, 'dist', 'Demo.package.avt');
    const build = Object.create(Build.prototype);
    build.initDone = true;
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

    const compileComponent = (name) => {
        const uri = `file:///D:/round146/${name.toLowerCase()}.wcl.avt`;
        const document = TextDocument.create(uri, 'typescript', 1,
            `@TagName("demo-${name.toLowerCase()}") export class ${name} {}`);
        const file = { uri, versionInternal: 1, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        parsed.classes[name].implements.push('Aventus.DefaultComponent');
        const logical = { file, fileParsed: parsed, build, viewMethodName: '__view', resetViewClassInfoDep() {} };
        return new AventusWebcomponentCompiler(logical, build).compile().result;
    };
    const first = compileComponent('Alpha');
    const second = compileComponent('Beta');
    build.buildOrderCompilationInfo = async () => ({ toCompile: [...first, ...second], libSrc: [], errors: [] });

    await build.build();

    const js = readFileSync(main, 'utf8');
    assert.ok(js.indexOf('class Alpha') >= 0);
    assert.ok(js.indexOf('class Beta') > js.indexOf('class Alpha'));
    const packageFile = Object.create(AventusPackageFile.prototype);
    packageFile._file = { contentUser: readFileSync(pkg, 'utf8') };
    packageFile.version = { major: 0, minor: 0, patch: 0 };
    const sections = packageFile.separeSection();
    assert.match(sections.jsDef, /Alpha/);
    assert.match(sections.jsDef, /Beta/);
    assert.deepEqual(notifications, [['aventus/compiled', ['Demo@web', []]]]);
});
