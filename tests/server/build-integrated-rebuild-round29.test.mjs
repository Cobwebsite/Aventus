import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { DependencyManager }, { AventusPackageFile }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
    'language-services/ts/package/File.ts',
]);

test('build and rebuild replace JavaScript and package outputs while preserving dependency routing', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.build-integrated-round29-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousServer = GenericServer.instance;
    const previousDependencies = DependencyManager.instance;
    const notifications = [];
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 4,
        connection: {
            delayBetweenBuild: () => 0,
            sendNotification: (name, args) => notifications.push([name, args]),
        },
    };
    DependencyManager.instance = { getPath: () => root };
    t.after(() => {
        GenericServer.instance = previousServer;
        DependencyManager.instance = previousDependencies;
    });

    const main = join(root, 'dist', 'main.js');
    const vendor = join(root, 'dist', 'vendor.js');
    const pkg = join(root, 'dist', 'Demo.package.avt');
    const compile = {
        output: [{ '@default': { path: main }, Vendor: { path: vendor } }],
        package: [pkg],
        outputNpm: { path: [], npmName: '', live: false },
    };
    const build = Object.create(Build.prototype);
    build.initDone = true;
    build._allowBuild = true;
    build.buildConfig = {
        fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0',
        rawDependencies: { 'Vendor@base': { version: '2.0.0' } },
        compile: [compile],
    };
    build.diagnostics = new Map();
    build.scssLanguageService = { getInternalDocumentation: () => ({ colors: [] }) };
    build.npmBuilder = { compile: async () => ({ result: '/* npm dependency */\n', errors: [] }) };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    let component = 'OldWidget';
    build.buildOrderCompilationInfo = async () => ({
        toCompile: [component],
        libSrc: [{ lib: 'Vendor', code: '/* vendor dependency */' }],
        errors: [],
    });
    build.buildLocalCode = async files => ({
        codeNoNamespaceBefore: [], code: [`class ${files[0]} {}`],
        classesName: {}, codeNoNamespaceAfter: [], useDecorator: false,
        stylesheets: { [files[0]]: '.widget{color:red}' },
        htmlDoc: { [files[0]]: '<div>view</div>' },
        doc: [`export class ${files[0]} {}`], docNoNamespace: [], docInvisible: [],
        codeRenderInJs: [], codeNotRenderInJs: [],
    });

    await build.build();
    assert.match(readFileSync(main, 'utf8'), /class OldWidget/);
    assert.match(readFileSync(main, 'utf8'), /Aventus\.Style\.store\("OldWidget"/);
    assert.doesNotMatch(readFileSync(main, 'utf8'), /vendor dependency/);
    assert.match(readFileSync(vendor, 'utf8'), /vendor dependency/);
    assert.match(readFileSync(pkg, 'utf8'), /export class OldWidget/);
    assert.deepEqual(notifications.at(-1), ['aventus/compiled', ['Demo@web', []]]);

    component = 'NewWidget';
    await build.build();
    const mainContent = readFileSync(main, 'utf8');
    const packageContent = readFileSync(pkg, 'utf8');
    assert.match(mainContent, /class NewWidget/);
    assert.doesNotMatch(mainContent, /OldWidget|vendor dependency/);
    assert.match(readFileSync(vendor, 'utf8'), /vendor dependency/);
    assert.match(packageContent, /export class NewWidget/);
    assert.doesNotMatch(packageContent, /OldWidget/);
    assert.equal(readFileSync(join(root, '@locals', 'Demo@web.package.avt'), 'utf8'), packageContent);
    const packageFile = Object.create(AventusPackageFile.prototype);
    packageFile._file = { contentUser: packageContent };
    packageFile.version = { major: 0, minor: 0, patch: 0 };
    const sections = packageFile.separeSection();
    assert.deepEqual(JSON.parse(sections.depsTxt), { 'Vendor@base': { version: '2.0.0' } });
    assert.deepEqual(JSON.parse(sections.scssTxt), { NewWidget: '.widget{color:red}' });
    assert.deepEqual(JSON.parse(sections.htmlTxt), { NewWidget: '<div>view</div>' });
    assert.deepEqual(notifications.filter(([name]) => name === 'aventus/compiled'), [
        ['aventus/compiled', ['Demo@web', []]],
        ['aventus/compiled', ['Demo@web', []]],
    ]);
});
