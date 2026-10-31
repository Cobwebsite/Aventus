import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('an explicit inclusion choice remains authoritative across transitive references and rebuilds', async () => {
    const packages = {
        'Aventus@Main': {},
        Shared: {},
        App: { Shared: { uri: '/Shared.package.avt', include: 'full' } },
    };
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const name = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        if (!packages[name]) return undefined;
        return {
            name, dependencies: packages[name], file: { uri, contentUser: '' },
            loadWebComponents() {},
        };
    };
    const previousFiles = ManifestPackage.files;
    const previousDone = ManifestPackage.done;
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    const dependencies = {
        App: { uri: '/App.package.avt', include: 'full' },
        Shared: { uri: '/Shared.package.avt', include: 'none' },
    };
    const resolve = () => manager.loadDependenciesFromBuild({ dependencies }, { buildConfig: {} });
    const filenames = uris => uris.map(uri => decodeURIComponent(uri).split('/').at(-1));
    try {
        const excluded = await resolve();
        assert.deepEqual(excluded.files.map(file => file.name), ['Aventus@Main', 'Shared', 'App']);
        assert.deepEqual(filenames(excluded.dependencyUris), ['Aventus@Main.package.avt', 'App.package.avt']);

        dependencies.Shared.include = 'full';
        const included = await resolve();
        assert.deepEqual(filenames(included.dependencyFullUris), ['Shared.package.avt', 'App.package.avt']);

        dependencies.Shared.include = 'none';
        const excludedAgain = await resolve();
        assert.deepEqual(filenames(excludedAgain.dependencyUris), filenames(excluded.dependencyUris));
        assert.deepEqual(excludedAgain.files.map(file => file.name), excluded.files.map(file => file.name));
    } finally {
        ManifestPackage.files = previousFiles;
        ManifestPackage.done = previousDone;
    }
});
