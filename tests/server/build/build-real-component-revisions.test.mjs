import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { DependencyManager }, { ParserTs },
    { AventusWebcomponentCompiler }, { AventusPackageFile }, { AventusSCSSLanguageService }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
    'language-services/ts/parser/ParserTs.ts', 'language-services/ts/component/compiler/compiler.ts',
    'language-services/ts/package/File.ts', 'language-services/scss/LanguageService.ts',
]);

test('real component compilation replaces JS and package declarations after source additions, edits and removals', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-real-components-round227-'));
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

    const sourceRoot = join(root, 'src');
    const alpha = join(sourceRoot, 'Alpha.wcl.avt');
    const beta = join(sourceRoot, 'Beta.wcl.avt');
    mkdirSync(sourceRoot);
    writeFileSync(alpha, '@TagName("demo-alpha-one") export class Alpha {}');
    const main = join(root, 'dist', 'main.js');
    const pkg = join(root, 'dist', 'Demo.package.avt');
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    Object.assign(build, {
        initDone: true, _allowBuild: true,
        buildConfig: {
            fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0', rawDependencies: {}, componentPrefix: 'demo',
            compile: [{ output: [{ '@default': { path: main } }], package: [pkg],
                outputNpm: { path: [], npmName: '', live: false } }],
        },
        project: { getConfig: () => ({ aliases: {} }) },
        namespaces: [], dependencyNeedUris: [], dependencyFullUris: [],
        getNamespace: () => '', getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        getComponentPrefix: () => 'demo', getWebComponentDefinitionFile: () => null,
        getWebComponentTagDependency: () => null, addNamespace: () => {},
        noNamespaceUri: {}, wcFiles: {}, tsFiles: {}, scssFiles: {}, htmlFiles: {},
        i18nComponentsFiles: {}, globalComponentSCSSFiles: {}, diagnostics: new Map(),
        tsLanguageService: { doValidation: () => [] },
        htmlLanguageService: { getInternalTagUri: () => null },
        npmBuilder: { compile: async () => ({ result: '', errors: [] }), unregister() {} },
    });
    build.scssLanguageService = new AventusSCSSLanguageService(build);
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    let revision = 0;
    build.buildOrderCompilationInfo = async () => {
        revision++;
        const compiled = [];
        for (const [name, path] of [['Alpha', alpha], ['Beta', beta]]) {
            if (!existsSync(path)) continue;
            const uri = `file:///D:/round227/${name.toLowerCase()}.wcl.avt`;
            const document = TextDocument.create(uri, 'typescript', revision, readFileSync(path, 'utf8'));
            const file = { uri, versionInternal: revision, documentUser: document, documentInternal: document };
            const parsed = ParserTs.parse(file, false, build);
            parsed.classes[name].implements.push('Aventus.DefaultComponent');
            const logical = { file, fileParsed: parsed, build, viewMethodName: '__view', resetViewClassInfoDep() {} };
            compiled.push(...new AventusWebcomponentCompiler(logical, build).compile().result);
        }
        return { toCompile: compiled, libSrc: [], errors: [] };
    };
    const definitions = () => {
        const file = Object.create(AventusPackageFile.prototype);
        file._file = { contentUser: readFileSync(pkg, 'utf8') };
        file.version = { major: 0, minor: 0, patch: 0 };
        return file.separeSection().jsDef;
    };
    const check = (present, absent) => {
        const js = readFileSync(main, 'utf8');
        const defs = definitions();
        for (const token of present) assert.match(js, new RegExp(token));
        for (const token of absent) assert.doesNotMatch(js, new RegExp(token));
        for (const name of ['Alpha', 'Beta']) {
            assert.equal(defs.includes(name), present.includes(name));
        }
    };

    await build.build();
    check(['Alpha', 'demo-alpha-one'], ['Beta']);
    writeFileSync(beta, '@TagName("demo-beta") export class Beta {}');
    await build.build();
    check(['Alpha', 'Beta', 'demo-alpha-one', 'demo-beta'], []);
    writeFileSync(alpha, '@TagName("demo-alpha-two") export class Alpha {}');
    await build.build();
    check(['Alpha', 'Beta', 'demo-alpha-two', 'demo-beta'], ['demo-alpha-one']);
    rmSync(beta);
    await build.build();
    check(['Alpha', 'demo-alpha-two'], ['Beta', 'demo-beta', 'demo-alpha-one']);
    assert.equal(notifications.filter(([name]) => name === 'aventus/compiled').length, 4);
});
