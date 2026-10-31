import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('a missing shared transitive package joins both branches after repair and leaves after removal', async () => {
    const packages = {
        'Aventus@Main': { dependencies: {} },
        Left: { dependencies: { Shared: { uri: '/Shared.package.avt', include: 'full' } } },
        Right: { dependencies: { Shared: { uri: '/Shared.package.avt', include: 'full' } } },
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
        const config = { dependencies: {
            Left: { uri: '/Left.package.avt', include: 'full' },
            Right: { uri: '/Right.package.avt', include: 'full' },
        } };
        const build = { buildConfig: {} };
        const names = result => result.files.map(file => file.name);
        const hasShared = result => result.dependencyUris.some(uri => uri.endsWith('Shared.package.avt'));

        const missing = await manager.loadDependenciesFromBuild(config, build);
        assert.deepEqual(new Set(names(missing)), new Set(['Aventus@Main', 'Left', 'Right']));
        assert.equal(hasShared(missing), false);

        packages.Shared = { dependencies: {} };
        const repaired = await manager.loadDependenciesFromBuild(config, build);
        assert.deepEqual(new Set(names(repaired)), new Set(['Aventus@Main', 'Shared', 'Left', 'Right']));
        assert.ok(names(repaired).indexOf('Shared') < names(repaired).indexOf('Left'));
        assert.ok(names(repaired).indexOf('Shared') < names(repaired).indexOf('Right'));
        assert.equal(repaired.files.filter(file => file.name === 'Shared').length, 1);
        assert.equal(repaired.dependencyUris.filter(uri => uri.endsWith('Shared.package.avt')).length, 1);
        assert.equal(packages.Shared.loads, 1);

        delete packages.Left.dependencies.Shared;
        delete packages.Right.dependencies.Shared;
        const removed = await manager.loadDependenciesFromBuild(config, build);
        assert.deepEqual(new Set(names(removed)), new Set(['Aventus@Main', 'Left', 'Right']));
        assert.equal(hasShared(removed), false);
    } finally {
        ManifestPackage.files = previous.files;
        ManifestPackage.done = previous.done;
    }
});
