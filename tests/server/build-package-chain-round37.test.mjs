import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { DependencyManager }, { SettingsManager }, { AventusPackageFile },
    { ManifestPackage }, { pathToUri }] = await loadServerModules([
    'project/Build.ts', 'project/DependencyManager.ts', 'settings/Settings.ts',
    'language-services/ts/package/File.ts', 'manifest/ManifestPackage.ts', 'tools.ts',
]);

test('two generated Aventus packages resolve a transitive import and run in dependency order', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.package-chain-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousDependency = DependencyManager.instance;
    const previousSettings = SettingsManager.instance;
    const previousManifestFiles = ManifestPackage.files;
    const previousManifestDone = ManifestPackage.done;
    DependencyManager.instance = { getPath: () => root };
    SettingsManager.instance = { settings: { useStats: false } };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    t.after(() => {
        DependencyManager.instance = previousDependency;
        SettingsManager.instance = previousSettings;
        ManifestPackage.files = previousManifestFiles;
        ManifestPackage.done = previousManifestDone;
    });

    const basePath = join(root, 'Base.package.avt');
    const appPath = join(root, 'App.package.avt');
    const write = async (name, output, dependencies, code) => {
        const build = Object.create(Build.prototype);
        build.buildConfig = {
            fullname: name, module: name, name: 'web', version: '1.0.0',
            rawDependencies: dependencies,
        };
        build.scssLanguageService = { getInternalDocumentation: () => ({}) };
        await build.writeBuildDocumentation([output], {
            doc: [`export class ${name}Item {}`], docNoNamespace: [], docInvisible: [],
            stylesheets: {}, htmlDoc: {}, codeRenderInJs: [], codeNotRenderInJs: [],
        }, {
            namespace: name,
            available: [{ fullName: `${name}.Item`, code }], existing: [],
        }, { path: [], npmName: '', live: false });
    };

    await write('Base', basePath, {}, 'globalThis.baseValue = 41;');
    await write('App', appPath, {
        Base: { uri: basePath, version: '1.0.0', include: 'full' },
    }, 'globalThis.appValue = globalThis.baseValue + 1;');

    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': join(root, 'Aventus@Main.package.avt') };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        if (uri === pathToUri(manager.predefinedPaths['Aventus@Main'])) {
            return { name: 'Aventus@Main', dependencies: {}, file: { uri, contentUser: '' }, loadWebComponents() {} };
        }
        const sourcePath = new Map([
            [pathToUri(basePath), basePath],
            [pathToUri(appPath), appPath],
        ]).get(uri);
        assert.ok(sourcePath, `unexpected package URI: ${uri}`);
        const content = readFileSync(sourcePath, 'utf8');
        const packageFile = Object.create(AventusPackageFile.prototype);
        packageFile._file = { uri, contentUser: content };
        packageFile.version = { major: 0, minor: 0, patch: 0 };
        const sections = packageFile.separeSection();
        assert.ok(sections);
        packageFile.dependencies = JSON.parse(sections.depsTxt);
        packageFile.srcInfo = JSON.parse(sections.jsSrc);
        packageFile.loadWebComponents = () => {};
        return packageFile;
    };

    const result = await manager.loadDependenciesFromBuild({ dependencies: {
        App: { uri: appPath, version: '1.0.0', include: 'full' },
    } }, { buildConfig: {} });
    assert.deepEqual(result.files.map(file => file.name), ['Aventus@Main', 'Base', 'App']);
    assert.deepEqual(result.dependencyFullUris, [pathToUri(basePath), pathToUri(appPath)]);
    assert.deepEqual(result.files.at(-1).dependencies, {
        Base: { uri: basePath, version: '1.0.0', include: 'full' },
    });

    const context = {};
    for (const file of result.files) {
        for (const item of file.srcInfo?.available ?? []) {
            runInNewContext(item.code, context);
        }
    }
    assert.equal(context.appValue, 42);
});
