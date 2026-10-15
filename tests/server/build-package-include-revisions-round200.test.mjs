import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { DependencyManager }, { SettingsManager }, { AventusPackageFile },
    { ManifestPackage }, { pathToUri }] = await loadServerModules([
    'project/Build.ts', 'project/DependencyManager.ts', 'settings/Settings.ts',
    'language-services/ts/package/File.ts', 'manifest/ManifestPackage.ts', 'tools.ts',
]);

test('generated package revises transitive inclusion from none to need to full', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-package-include-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        dependency: DependencyManager.instance, settings: SettingsManager.instance,
        files: ManifestPackage.files, done: ManifestPackage.done,
    };
    DependencyManager.instance = { getPath: () => root };
    SettingsManager.instance = { settings: { useStats: false } };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    t.after(() => {
        DependencyManager.instance = previous.dependency;
        SettingsManager.instance = previous.settings;
        ManifestPackage.files = previous.files;
        ManifestPackage.done = previous.done;
    });

    const paths = Object.fromEntries(['Core', 'Feature', 'App'].map(name =>
        [name, join(root, `${name}.package.avt`)]));
    const dependency = (name, include = 'full') => ({ uri: paths[name], version: '1.0.0', include });
    const write = async (name, dependencies, code) => {
        const build = Object.create(Build.prototype);
        build.buildConfig = {
            fullname: name, module: name, name: 'web', version: '1.0.0', rawDependencies: dependencies,
        };
        build.scssLanguageService = { getInternalDocumentation: () => ({}) };
        await build.writeBuildDocumentation([paths[name]], {
            doc: [`export class ${name}Item {}`], docNoNamespace: [], docInvisible: [],
            stylesheets: {}, htmlDoc: {}, codeRenderInJs: [], codeNotRenderInJs: [],
        }, {
            namespace: name, available: [{ fullName: `${name}.Item`, code }], existing: [],
        }, { path: [], npmName: '', live: false });
    };
    await write('Core', {}, 'globalThis.core = 6;');
    await write('Feature', { Core: dependency('Core', 'none') },
        'globalThis.feature = globalThis.core * 2;');

    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': join(root, 'Aventus@Main.package.avt') };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        if (uri === pathToUri(manager.predefinedPaths['Aventus@Main'])) {
            return { name: 'Aventus@Main', dependencies: {}, file: { uri, contentUser: '' }, loadWebComponents() {} };
        }
        const name = Object.keys(paths).find(candidate => pathToUri(paths[candidate]) === uri);
        assert.ok(name, `unexpected package URI: ${uri}`);
        const file = Object.create(AventusPackageFile.prototype);
        file._file = { uri, contentUser: readFileSync(paths[name], 'utf8') };
        file.version = { major: 0, minor: 0, patch: 0 };
        const sections = file.separeSection();
        assert.ok(sections);
        file.dependencies = JSON.parse(sections.depsTxt);
        file.srcInfo = JSON.parse(sections.jsSrc);
        file.loadWebComponents = () => {};
        return file;
    };

    for (const include of ['none', 'need', 'full']) {
        await write('App', { Feature: dependency('Feature', include) },
            'globalThis.app = globalThis.feature + 1;');
        const appFile = Object.assign(Object.create(AventusPackageFile.prototype), {
            _file: { contentUser: readFileSync(paths.App, 'utf8') },
            version: { major: 0, minor: 0, patch: 0 },
        });
        assert.deepEqual(JSON.parse(appFile.separeSection().depsTxt), {
            Feature: dependency('Feature', include),
        });
        const result = await manager.loadDependenciesFromBuild({ dependencies: {
            App: dependency('App'),
        } }, { buildConfig: {} });
        assert.deepEqual(result.files.map(file => file.name), ['Aventus@Main', 'Core', 'Feature', 'App']);
        assert.deepEqual(result.dependencyFullUris,
            [...(include === 'full' ? [pathToUri(paths.Feature)] : []), pathToUri(paths.App)]);
        assert.deepEqual(result.dependencyNeedUris,
            [pathToUri(manager.predefinedPaths['Aventus@Main']),
                ...(include === 'need' ? [pathToUri(paths.Feature)] : [])]);
        assert.deepEqual(result.dependencyUris, [pathToUri(manager.predefinedPaths['Aventus@Main']),
            ...(include !== 'none' ? [pathToUri(paths.Feature)] : []), pathToUri(paths.App)]);
        const context = {};
        for (const file of result.files) {
            for (const item of file.srcInfo?.available ?? []) runInNewContext(item.code, context);
        }
        assert.equal(context.app, 13);
    }
});
