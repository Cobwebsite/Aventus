import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { AventusWebSCSSFile }, { InternalAventusFile }, { FilesManager },
    { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService },
    { GenericServer }, { SettingsManager }, { DependencyManager }, { AventusPackageFile }] = await loadServerModules([
    'project/Build.ts', 'language-services/scss/File.ts', 'files/AventusFile.ts',
    'files/FilesManager.ts', 'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts', 'GenericServer.ts',
    'settings/Settings.ts', 'project/DependencyManager.ts', 'language-services/ts/package/File.ts',
]);

test('Sass import error reaches diagnostics and corrected mixin replaces generated build styles', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.scss-build-round52-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const main = join(root, 'dist', 'main.js');
    const pkg = join(root, 'dist', 'Demo.package.avt');
    const uriRoot = 'file:///D:/round52-scss/';
    const files = Object.fromEntries(Object.entries({
        'tokens.wcs.avt': '$accent: #123456;',
        'badge.wcs.avt': '@import "tokens"; .badge { @include badge(2px); }',
    }).map(([name, content]) => [name, new InternalAventusFile(TextDocument.create(uriRoot + name, 'scss', 1, content))]));
    const byPath = new Map(Object.values(files).map(file => [file.path.replace(/\\/g, '/'), file]));
    const previous = {
        getFiles: FilesManager.getInstance,
        server: GenericServer.instance,
        settings: SettingsManager.instance,
        dependencies: DependencyManager.instance,
    };
    const diagnostics = [];
    FilesManager.getInstance = () => ({ getByPath: path => byPath.get(path.replace(/\\/g, '/')) });
    SettingsManager.instance = { settings: { errorByBuild: false } };
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 4,
        connection: {
            delayBetweenBuild: () => 0,
            sendNotification() {},
            sendDiagnostics: (params, buildName) => diagnostics.push({ params, buildName }),
        },
    };
    DependencyManager.instance = { getPath: () => root };
    t.after(() => {
        FilesManager.getInstance = previous.getFiles;
        GenericServer.instance = previous.server;
        SettingsManager.instance = previous.settings;
        DependencyManager.instance = previous.dependencies;
    });

    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    build.initDone = true;
    build._allowBuild = true;
    build.buildConfig = {
        fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0', rawDependencies: {},
        compile: [{ output: [{ '@default': { path: main } }], package: [pkg],
            outputNpm: { path: [], npmName: '', live: false } }],
    };
    build.project = {
        resolveAlias: value => value,
        globalSCSSLanguageService: new AventusGlobalSCSSLanguageService(),
    };
    build.getNamespace = () => '';
    build.noNamespaceUri = {};
    build.tsFiles = {};
    build.scssFiles = {};
    build.htmlFiles = {};
    build.globalComponentSCSSFiles = {};
    build.diagnostics = new Map();
    build.scssLanguageService = new AventusSCSSLanguageService(build);
    build.npmBuilder = { compile: async () => ({ result: '', errors: [] }) };
    build.buildOrderCompilationInfo = async () => ({ toCompile: [], libSrc: [], errors: [] });
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };

    const badge = new AventusWebSCSSFile(files['badge.wcs.avt'], build);
    build.scssFiles[badge.file.uri] = badge;
    build.globalComponentSCSSFiles[badge.file.uri] = badge;
    await badge.init();
    assert.equal(badge.compileResult, '');
    assert.ok(diagnostics.some(event => event.params.uri === badge.file.uri &&
        event.params.diagnostics.some(item => /Undefined mixin/.test(item.message))));

    const output = async () => {
        await build.build();
        const packageFile = Object.create(AventusPackageFile.prototype);
        packageFile._file = { contentUser: readFileSync(pkg, 'utf8') };
        packageFile.version = { major: 0, minor: 0, patch: 0 };
        return {
            js: readFileSync(main, 'utf8'),
            styles: JSON.parse(packageFile.separeSection().scssTxt),
        };
    };
    const first = await output();
    assert.equal(first.styles.badge, '');

    files['tokens.wcs.avt']._documentUser = TextDocument.create(files['tokens.wcs.avt'].uri, 'scss', 2,
        '$accent: #abcdef; @mixin badge($size) { border: $size solid $accent; }');
    await badge.triggerSave();
    assert.match(badge.compileResult, /border:2px solid #abcdef/);
    assert.ok(diagnostics.some(event => event.params.uri === badge.file.uri && event.params.diagnostics.length === 0));
    const second = await output();
    assert.match(second.styles.badge, /border:2px solid #abcdef/);
    assert.equal(second.js, first.js);
    assert.doesNotMatch(first.js, /#abcdef/);
});
