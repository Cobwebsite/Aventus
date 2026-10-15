import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('a transitive inclusion edit updates emitted imports on successive resolutions', async () => {
    const definitions = {
        'Aventus@Main': {},
        Shared: {},
        App: { Shared: { uri: '/Shared.package.avt', include: 'none' } },
    };
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const name = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        if (!Object.hasOwn(definitions, name)) return undefined;
        return {
            name, dependencies: definitions[name], file: { uri, contentUser: '' },
            loadWebComponents() {},
        };
    };
    const previous = { files: ManifestPackage.files, done: ManifestPackage.done };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    try {
        const config = { dependencies: { App: { uri: '/App.package.avt', include: 'full' } } };
        const build = { buildConfig: {} };
        const names = uris => uris.map(uri => decodeURIComponent(uri).split('/').at(-1));
        for (const [include, expectedNeed, expectedFull] of [
            ['none', ['Aventus@Main.package.avt'], ['App.package.avt']],
            ['full', ['Aventus@Main.package.avt'], ['Shared.package.avt', 'App.package.avt']],
            ['need', ['Aventus@Main.package.avt', 'Shared.package.avt'], ['App.package.avt']],
            ['none', ['Aventus@Main.package.avt'], ['App.package.avt']],
        ]) {
            definitions.App.Shared.include = include;
            const result = await manager.loadDependenciesFromBuild(config, build);
            assert.deepEqual(result.files.map(file => file.name), ['Aventus@Main', 'Shared', 'App']);
            assert.deepEqual(names(result.dependencyNeedUris), expectedNeed);
            assert.deepEqual(names(result.dependencyFullUris), expectedFull);
            assert.deepEqual(names(result.dependencyUris), [...expectedNeed, ...expectedFull].sort((a, b) =>
                result.files.findIndex(file => file.name === a.replace('.package.avt', '')) -
                result.files.findIndex(file => file.name === b.replace('.package.avt', ''))));
        }
    } finally {
        ManifestPackage.files = previous.files;
        ManifestPackage.done = previous.done;
    }
});
