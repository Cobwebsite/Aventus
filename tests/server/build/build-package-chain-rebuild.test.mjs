import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { DependencyManager }, { SettingsManager }, { AventusPackageFile },
    { ManifestPackage }, { pathToUri }] = await loadServerModules([
    'project/Build.ts', 'project/DependencyManager.ts', 'settings/Settings.ts',
    'language-services/ts/package/File.ts', 'manifest/ManifestPackage.ts', 'tools.ts',
]);

test('three generated packages deduplicate a shared dependency and reread changed intermediate code', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.package-chain-rebuild-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        dependency: DependencyManager.instance, settings: SettingsManager.instance,
        manifestFiles: ManifestPackage.files, manifestDone: ManifestPackage.done,
    };
    DependencyManager.instance = { getPath: () => root };
    SettingsManager.instance = { settings: { useStats: false } };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    t.after(() => {
        DependencyManager.instance = previous.dependency;
        SettingsManager.instance = previous.settings;
        ManifestPackage.files = previous.manifestFiles;
        ManifestPackage.done = previous.manifestDone;
    });

    const paths = Object.fromEntries(['Base', 'Middle', 'App'].map(name =>
        [name, join(root, `${name}.package.avt`)]));
    const dep = name => ({ uri: paths[name], version: '1.0.0', include: 'full' });
    const write = async (name, dependencies, code) => {
        const build = Object.create(Build.prototype);
        build.buildRevision = 0;
        build.buildConfig = {
            fullname: name, module: name, name: 'web', version: '1.0.0',
            rawDependencies: dependencies,
        };
        build.scssLanguageService = { getInternalDocumentation: () => ({}) };
        await build.writeBuildDocumentation([paths[name]], {
            doc: [`export class ${name}Item {}`], docNoNamespace: [], docInvisible: [],
            stylesheets: {}, htmlDoc: {}, codeRenderInJs: [], codeNotRenderInJs: [],
        }, {
            namespace: name,
            available: [{ fullName: `${name}.Item`, code }], existing: [],
        }, { path: [], npmName: '', live: false });
    };

    await write('Base', {}, 'globalThis.baseValue = 10;');
    await write('Middle', { Base: dep('Base') }, 'globalThis.middleValue = globalThis.baseValue * 2;');
    await write('App', { Middle: dep('Middle'), Base: dep('Base') },
        'globalThis.appValue = globalThis.middleValue + globalThis.baseValue;');

    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': join(root, 'Aventus@Main.package.avt') };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        if (uri === pathToUri(manager.predefinedPaths['Aventus@Main'])) {
            return { name: 'Aventus@Main', dependencies: {}, file: { uri, contentUser: '' }, loadWebComponents() {} };
        }
        const name = Object.keys(paths).find(key => pathToUri(paths[key]) === uri);
        assert.ok(name, `unexpected package URI: ${uri}`);
        const packageFile = Object.create(AventusPackageFile.prototype);
        packageFile._file = { uri, contentUser: readFileSync(paths[name], 'utf8') };
        packageFile.version = { major: 0, minor: 0, patch: 0 };
        const sections = packageFile.separeSection();
        assert.ok(sections);
        packageFile.dependencies = JSON.parse(sections.depsTxt);
        packageFile.srcInfo = JSON.parse(sections.jsSrc);
        packageFile.loadWebComponents = () => {};
        return packageFile;
    };
    const load = async () => manager.loadDependenciesFromBuild({ dependencies: {
        App: dep('App'), Base: dep('Base'),
    } }, { buildConfig: {} });
    const execute = files => {
        const context = {};
        for (const file of files) {
            for (const item of file.srcInfo?.available ?? []) runInNewContext(item.code, context);
        }
        return context;
    };

    const first = await load();
    assert.deepEqual(first.files.map(file => file.name), ['Aventus@Main', 'Base', 'Middle', 'App']);
    assert.deepEqual(first.dependencyFullUris, Object.values(paths).map(pathToUri));
    assert.equal(execute(first.files).appValue, 30);

    await write('Middle', { Base: dep('Base') }, 'globalThis.middleValue = globalThis.baseValue * 3;');
    const second = await load();
    assert.deepEqual(second.files.map(file => file.name), ['Aventus@Main', 'Base', 'Middle', 'App']);
    assert.deepEqual(second.dependencyFullUris, Object.values(paths).map(pathToUri));
    assert.equal(execute(second.files).appValue, 40);
    assert.doesNotMatch(readFileSync(paths.Middle, 'utf8'), /baseValue \* 2/);
});
