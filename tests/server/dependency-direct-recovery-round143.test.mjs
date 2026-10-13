import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }, { GenericServer }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('a direct dependency disappears and returns without stale package or URI entries', async () => {
    const originalFiles = ManifestPackage.files;
    const originalDone = ManifestPackage.done;
    const originalServer = GenericServer.instance;
    const packages = {
        'Aventus@Main': { name: 'Aventus@Main', dependencies: {} },
        Feature: { name: 'Feature', dependencies: {}, revision: 1 },
    };
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const name = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        const source = packages[name];
        return source && {
            name: source.name,
            dependencies: source.dependencies,
            revision: source.revision,
            file: { uri, contentUser: '' },
            loadWebComponents() {},
        };
    };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    GenericServer.instance = { logLevel: 0, connection: { showErrorMessage() {} } };
    try {
        const config = { dependencies: { Feature: { uri: '/Feature.package.avt', include: 'full' } } };
        const build = { buildConfig: {} };
        const first = await manager.loadDependenciesFromBuild(config, build);
        assert.deepEqual(first.files.map(file => file.name), ['Aventus@Main', 'Feature']);
        assert.deepEqual(first.dependencyFullUris.map(uri => decodeURIComponent(uri).split('/').at(-1)), ['Feature.package.avt']);
        assert.equal(first.files.at(-1).revision, 1);

        delete packages.Feature;
        const missing = await manager.loadDependenciesFromBuild(config, build);
        assert.deepEqual(missing.files.map(file => file.name), ['Aventus@Main']);
        assert.deepEqual(missing.dependencyFullUris, []);
        assert.equal(missing.dependencyUris.some(uri => uri.endsWith('Feature.package.avt')), false);

        packages.Feature = { name: 'Feature', dependencies: {}, revision: 2 };
        const restored = await manager.loadDependenciesFromBuild(config, build);
        assert.deepEqual(restored.files.map(file => file.name), ['Aventus@Main', 'Feature']);
        assert.equal(restored.files.at(-1).revision, 2);
        assert.deepEqual(restored.dependencyFullUris.map(uri => decodeURIComponent(uri).split('/').at(-1)), ['Feature.package.avt']);
        assert.equal(new Set(restored.dependencyUris).size, restored.dependencyUris.length);
    } finally {
        ManifestPackage.files = originalFiles;
        ManifestPackage.done = originalDone;
        GenericServer.instance = originalServer;
    }
});
