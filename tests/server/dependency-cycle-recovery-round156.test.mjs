import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('a dependency cycle reports its path and a later acyclic revision resolves on the same manager', async () => {
    const packages = {
        'Aventus@Main': { dependencies: {} },
        Alpha: { dependencies: { Beta: { uri: '/Beta.package.avt' } } },
        Beta: { dependencies: { Alpha: { uri: '/Alpha.package.avt' } } },
    };
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const name = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        const source = packages[name];
        if (!source) return undefined;
        return {
            name, dependencies: source.dependencies, file: { uri, contentUser: '' },
            loadWebComponents() { source.loads = (source.loads ?? 0) + 1; },
        };
    };
    const previous = { files: ManifestPackage.files, done: ManifestPackage.done };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    try {
        const config = { dependencies: { Alpha: { uri: '/Alpha.package.avt', include: 'full' } } };
        const build = { buildConfig: {} };
        const cyclic = await manager.loadDependenciesFromBuild(config, build);
        assert.deepEqual(cyclic.cycle, ['Alpha', 'Beta', 'Alpha']);
        assert.deepEqual(cyclic.files, []);
        assert.deepEqual(cyclic.dependencyUris, []);
        assert.equal(packages.Alpha.loads ?? 0, 0);
        assert.equal(packages.Beta.loads ?? 0, 0);

        packages.Beta.dependencies = {};
        const repaired = await manager.loadDependenciesFromBuild(config, build);
        assert.equal(repaired.cycle, undefined);
        assert.deepEqual(repaired.files.map(file => file.name), ['Aventus@Main', 'Beta', 'Alpha']);
        assert.equal(repaired.dependencyFullUris.length, 1);
        assert.ok(repaired.dependencyFullUris[0].endsWith('Alpha.package.avt'));
        assert.equal(packages.Alpha.loads, 1);
        assert.equal(packages.Beta.loads, 1);
    } finally {
        ManifestPackage.files = previous.files;
        ManifestPackage.done = previous.done;
    }
});
