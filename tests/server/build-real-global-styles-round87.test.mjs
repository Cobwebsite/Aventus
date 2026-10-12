import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { AventusWebSCSSFile }, { InternalAventusFile }, { GenericServer },
    { DependencyManager }, { AventusPackageFile }, { HttpServer },
    { AventusSCSSLanguageService }] = await loadServerModules([
    'project/Build.ts', 'language-services/scss/File.ts', 'files/AventusFile.ts',
    'GenericServer.ts', 'project/DependencyManager.ts', 'language-services/ts/package/File.ts',
    'live-server/HttpServer.ts', 'language-services/scss/LanguageService.ts',
]);

test('real global SCSS files enter JS and package while local style stays out, then rebuild replaces changed globals', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-styles-round87-'));
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
    build.initDone = true;
    build._allowBuild = true;
    build.buildConfig = {
        fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0', rawDependencies: {},
        compile: [{ output: [{ '@default': { path: main } }], package: [pkg],
            outputNpm: { path: [], npmName: '', live: false } }],
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
    const realBuildLocalCode = build.buildLocalCode.bind(build);
    build.buildLocalCode = async (...args) => {
        const result = await realBuildLocalCode(...args);
        result.code.push('class Widget {}');
        return result;
    };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };

    const source = (name, version, content) => new InternalAventusFile(
        TextDocument.create(`file:///D:/round87/${name}.wcs.avt`, 'scss', version, content));
    const base = source('@base', 1, ':root { --brand: red; }');
    const theme = source('@theme', 1, ':root { --surface: blue; }');
    const local = source('card', 1, '.card { color: green; }');
    for (const file of [base, theme, local]) {
        const style = new AventusWebSCSSFile(file, build);
        build.scssFiles[file.uri] = style;
        if (style.isGlobal) build.globalComponentSCSSFiles[file.uri] = style;
        await style.init();
    }
    const inspect = async () => {
        await build.build();
        const packageFile = Object.create(AventusPackageFile.prototype);
        packageFile._file = { contentUser: readFileSync(pkg, 'utf8') };
        packageFile.version = { major: 0, minor: 0, patch: 0 };
        return { js: readFileSync(main, 'utf8'), styles: JSON.parse(packageFile.separeSection().scssTxt) };
    };
    const first = await inspect();
    assert.deepEqual(Object.keys(first.styles), ['@base', '@theme']);
    assert.match(first.styles['@base'], /--brand:\s*red/);
    assert.match(first.styles['@theme'], /--surface:\s*blue/);
    assert.doesNotMatch(first.js, /\.card\{color:green/);
    assert.ok(first.js.indexOf('Style.store("@base"') < first.js.indexOf('Style.store("@theme"'));

    delete build.globalComponentSCSSFiles[base.uri];
    delete build.scssFiles[base.uri];
    theme._documentUser = TextDocument.create(theme.uri, 'scss', 2, ':root { --surface: purple; }');
    await build.scssFiles[theme.uri].triggerSave();
    const second = await inspect();
    assert.deepEqual(Object.keys(second.styles), ['@theme']);
    assert.match(second.styles['@theme'], /--surface:\s*purple/);
    assert.doesNotMatch(second.js, /--brand|--surface:\s*blue|\.card\{color:\s*green/);
    assert.match(second.js, /--surface:\s*purple/);
});
