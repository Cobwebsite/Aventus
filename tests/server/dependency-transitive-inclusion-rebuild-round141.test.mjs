import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('re-resolving a changed transitive inclusion updates generated imports without retaining the old choice', async () => {
    const definitions = {
        'Aventus@Main': {},
        Shared: {},
        App: { Shared: { uri: '/Shared.package.avt', include: 'none' } },
    };
    const loadCounts = new Map();
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const name = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        if (!Object.hasOwn(definitions, name)) return undefined;
        return {
            name, dependencies: definitions[name], file: { uri, contentUser: '' },
            loadWebComponents() { loadCounts.set(name, (loadCounts.get(name) ?? 0) + 1); },
        };
    };
    const oldFiles = ManifestPackage.files;
    const oldDone = ManifestPackage.done;
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    const resolve = () => manager.loadDependenciesFromBuild({ dependencies: {
        App: { uri: '/App.package.avt', include: 'full' },
    } }, { buildConfig: {} });
    const names = result => result.files.map(file => file.name);
    const imported = result => result.dependencyUris.map(uri => decodeURIComponent(uri).split('/').at(-1));
    try {
        const excluded = await resolve();
        assert.deepEqual(names(excluded), ['Aventus@Main', 'Shared', 'App']);
        assert.deepEqual(imported(excluded), ['Aventus@Main.package.avt', 'App.package.avt']);

        definitions.App.Shared.include = 'full';
        const included = await resolve();
        assert.deepEqual(names(included), ['Aventus@Main', 'Shared', 'App']);
        assert.deepEqual(imported(included), ['Aventus@Main.package.avt', 'Shared.package.avt', 'App.package.avt']);
        assert.deepEqual(included.dependencyFullUris.map(uri => decodeURIComponent(uri).split('/').at(-1)),
            ['Shared.package.avt', 'App.package.avt']);

        definitions.App.Shared.include = 'none';
        const excludedAgain = await resolve();
        assert.deepEqual(imported(excludedAgain), imported(excluded));
        assert.deepEqual(Object.fromEntries(loadCounts), { 'Aventus@Main': 3, Shared: 3, App: 3 });
    } finally {
        ManifestPackage.files = oldFiles;
        ManifestPackage.done = oldDone;
    }
});
