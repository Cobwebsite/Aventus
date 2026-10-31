import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { DependencyManager }, { ParserTs },
    { AventusWebcomponentCompiler }, { AventusPackageFile }, { AventusWebSCSSFile },
    { AventusHTMLFile }, { InternalAventusFile }, { AventusSCSSLanguageService }, { SettingsManager }, { NpmBuilder },
    { AventusWebComponentLogicalFile }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
    'language-services/ts/parser/ParserTs.ts', 'language-services/ts/component/compiler/compiler.ts',
    'language-services/ts/package/File.ts', 'language-services/scss/File.ts',
    'language-services/html/File.ts', 'files/AventusFile.ts', 'language-services/scss/LanguageService.ts',
    'settings/Settings.ts', 'project/BuildNpm.ts', 'language-services/ts/component/File.ts',
]);

test('one full build combines two real component views and styles with npm output, then refreshes them', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-real-multifile-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const oldServer = GenericServer.instance;
    const oldDependencies = DependencyManager.instance;
    const oldSettings = SettingsManager.instance;
    GenericServer.instance = { _noBuild: false, isIDE: false, logLevel: 4,
        connection: { delayBetweenBuild: () => 0, sendNotification() {}, sendDiagnostics() {} } };
    DependencyManager.instance = { getPath: () => root };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    t.after(() => { GenericServer.instance = oldServer; DependencyManager.instance = oldDependencies;
        SettingsManager.instance = oldSettings; });

    const main = join(root, 'dist', 'main.js');
    const npm = join(root, 'dist', 'npm.js');
    const pkg = join(root, 'dist', 'Demo.package.avt');
    const dependency = join(root, 'local-dependency.js');
    writeFileSync(dependency, 'export const marker = "local npm dependency";');
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    Object.assign(build, {
        initDone: false, _allowBuild: true,
        buildConfig: { fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0',
            rawDependencies: { 'Local@helper': { version: '1.0.0' } }, componentPrefix: 'demo',
            nodeModulesDir: join(root, 'node_modules'),
            compile: [{ output: [{ '@default': { path: main }, '@npm': { path: npm } }], package: [pkg],
                outputNpm: { path: [], npmName: '', live: false } }] },
        project: { getConfig: () => ({ aliases: {} }) }, namespaces: [],
        dependencyNeedUris: [], dependencyFullUris: [], noNamespaceUri: {},
        wcFiles: {}, tsFiles: {}, scssFiles: {}, htmlFiles: {}, i18nComponentsFiles: {},
        globalComponentSCSSFiles: {}, diagnostics: new Map(),
        tsLanguageService: { doValidation: () => [] },
        htmlLanguageService: { getInternalTagUri: () => null, getClassByTag: () => null,
            doValidation: async () => [] },
    });
    build.scssLanguageService = new AventusSCSSLanguageService(build);
    build.npmBuilder = new NpmBuilder(build);
    build.getNamespace = () => '';
    build.getNamespaceForUri = () => '';
    build.getNpmReplacementName = () => '';
    build.getComponentPrefix = () => 'demo';
    build.getWebComponentDefinitionFile = () => null;
    build.getWebComponentTagDependency = () => null;
    build.getAvoidParsingTags = () => [];
    build.addNamespace = () => {};
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };

    const components = [];
    for (const name of ['Alpha', 'Beta']) {
        const base = `file:///D:/multifile/${name.toLowerCase()}`;
        const logicUri = `${base}.wcl.avt`;
        const logicDoc = TextDocument.create(logicUri, 'typescript', 1, name === 'Alpha'
            ? '@TagName("demo-alpha") export class Alpha { @Attribute() title: string = "Ready"; ready = true; items = [{ name: "One", active: true }]; }'
            : '@TagName("demo-beta") export class Beta {}');
        const logic = { uri: logicUri, versionInternal: 1, documentUser: logicDoc, documentInternal: logicDoc };
        const parsed = ParserTs.parse(logic, false, build);
        parsed.classes[name].implements.push('Aventus.DefaultComponent');
        const logical = Object.create(AventusWebComponentLogicalFile.prototype);
        logical._file = logic;
        logical._build = build;
        logical.fileParsed = parsed;
        logical._componentClassName = name;
        logical.htmlDiagnostics = [];
        Object.defineProperty(logical, 'viewMethodName', { value: '__view' });
        logical.resetViewClassInfoDep = () => {};
        build.tsFiles[logicUri] = logical;
        const viewFile = new InternalAventusFile(TextDocument.create(`${base}.wcv.avt`, 'Aventus HTML', 1,
            name === 'Alpha'
                ? 'for (const item of items) { if (item.active) { <p>{{item.name}} Alpha first</p> } }'
                : '<p>Beta first</p>'));
        const view = new AventusHTMLFile(viewFile, build);
        build.htmlFiles[viewFile.uri] = view;
        assert.equal(view.tsFile, logical);
        await view.init();
        const styleFile = new InternalAventusFile(TextDocument.create(`${base}.wcs.avt`, 'Aventus SCSS', 1,
            `.${name.toLowerCase()} { color: red; }`));
        const style = new AventusWebSCSSFile(styleFile, build);
        build.scssFiles[styleFile.uri] = style;
        await style.init();
        components.push({ name, logical, viewFile, styleFile, style });
    }
    assert.deepEqual(build.npmBuilder.register('file:///D:/multifile/alpha.wcl.avt',
        { uri: './local-dependency.js', libName: 'marker' }), []);
    t.after(async () => {
        for (const { viewFile, styleFile } of components) {
            await viewFile.triggerDelete();
            await styleFile.triggerDelete();
        }
    });
    build.initDone = true;
    build.buildOrderCompilationInfo = async () => ({
        toCompile: components.flatMap(({ logical }) => new AventusWebcomponentCompiler(logical, build).compile().result),
        libSrc: [], errors: [],
    });

    const inspect = async () => {
        await build.build();
        const packageFile = Object.create(AventusPackageFile.prototype);
        packageFile._file = { contentUser: readFileSync(pkg, 'utf8') };
        packageFile.version = { major: 0, minor: 0, patch: 0 };
        return { js: readFileSync(main, 'utf8'), npm: readFileSync(npm, 'utf8'),
            sections: packageFile.separeSection() };
    };
    const first = await inspect();
    for (const name of ['Alpha', 'Beta']) {
        assert.match(first.js, new RegExp(`class ${name}`));
        assert.match(first.js, new RegExp(`${name} first`));
        assert.match(first.js, new RegExp(`\\.${name.toLowerCase()}\\{color:red\\}`));
    }
    assert.match(first.npm, /local npm dependency/);
    assert.doesNotMatch(first.js, /local npm dependency/);
    assert.match(first.sections.jsDef, /Alpha/);
    assert.match(first.sections.jsDef, /Beta/);
    assert.match(first.js, /title/);
    assert.match(first.js, /addIf/);
    assert.match(first.js, /addLoop/);
    assert.match(first.js, /__view\d+\(c\.data\.item\)/);
    assert.doesNotMatch(first.js, /c\.comp\.\(/);
    assert.deepEqual(ts.createSourceFile('main.js', first.js, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
    assert.deepEqual(JSON.parse(first.sections.depsTxt), { 'Local@helper': { version: '1.0.0' } });

    const alpha = components[0];
    await alpha.viewFile.triggerContentChange(TextDocument.create(alpha.viewFile.uri, 'Aventus HTML', 2,
        'for (const item of items) { if (item.active) { <p>{{item.name}} Alpha updated</p> } }'));
    alpha.styleFile._documentUser = TextDocument.create(alpha.styleFile.uri, 'Aventus SCSS', 2,
        '.alpha { color: blue; }');
    await alpha.style.triggerSave();
    const second = await inspect();
    assert.match(second.js, /Alpha updated/);
    assert.match(second.js, /\.alpha\{color:blue\}/);
    assert.doesNotMatch(second.js, /Alpha first|\.alpha\{color:red\}/);
    assert.match(second.js, /Beta first|\.beta\{color:red\}/);
    assert.match(second.npm, /local npm dependency/);
});
