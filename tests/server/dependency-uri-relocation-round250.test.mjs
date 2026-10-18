import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }, { GenericServer }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('a direct package follows URI relocation and replaces its transitive branch on one manager', async () => {
    const previous = [ManifestPackage.files, ManifestPackage.done, GenericServer.instance];
    const sources = new Map([
        ['/Aventus@Main.package.avt', { name: 'Aventus@Main', dependencies: {} }],
        ['/v1/Feature.package.avt', { name: 'Feature', revision: 1, dependencies: {
            OldLeaf: { uri: '/OldLeaf.package.avt', include: 'full' },
        } }],
        ['/v2/Feature.package.avt', { name: 'Feature', revision: 2, dependencies: {
            NewLeaf: { uri: '/NewLeaf.package.avt', include: 'full' },
        } }],
        ['/OldLeaf.package.avt', { name: 'OldLeaf', dependencies: {} }],
        ['/NewLeaf.package.avt', { name: 'NewLeaf', dependencies: {} }],
    ]);
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const source = [...sources].find(([path]) => decodeURIComponent(uri).endsWith(path))?.[1];
        return source && { ...source, file: { uri, contentUser: '' }, loadWebComponents() {} };
    };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    GenericServer.instance = { logLevel: 0, connection: { showErrorMessage() {} } };
    try {
        const config = { dependencies: {
            Feature: { uri: '/v1/Feature.package.avt', include: 'full' },
        } };
        const resolve = () => manager.loadDependenciesFromBuild(config, { buildConfig: {} });
        const names = result => result.files.map(file => file.name);
        const paths = uris => uris.map(uri => [...sources.keys()].find(path => decodeURIComponent(uri).endsWith(path)));

        const first = await resolve();
        assert.deepEqual(new Set(names(first)), new Set(['Aventus@Main', 'Feature', 'OldLeaf']));
        assert.equal(first.files.find(file => file.name === 'Feature').revision, 1);
        assert.deepEqual(paths(first.dependencyFullUris), ['/OldLeaf.package.avt', '/v1/Feature.package.avt']);

        config.dependencies.Feature.uri = '/v2/Feature.package.avt';
        const relocated = await resolve();
        assert.deepEqual(new Set(names(relocated)), new Set(['Aventus@Main', 'Feature', 'NewLeaf']));
        assert.equal(relocated.files.find(file => file.name === 'Feature').revision, 2);
        assert.deepEqual(paths(relocated.dependencyFullUris), ['/NewLeaf.package.avt', '/v2/Feature.package.avt']);
        assert.equal(paths(relocated.dependencyUris).includes('/OldLeaf.package.avt'), false);

        config.dependencies.Feature.uri = '/v1/Feature.package.avt';
        const restored = await resolve();
        assert.deepEqual(new Set(names(restored)), new Set(['Aventus@Main', 'Feature', 'OldLeaf']));
        assert.deepEqual(paths(restored.dependencyFullUris), ['/OldLeaf.package.avt', '/v1/Feature.package.avt']);
        assert.equal(new Set(restored.dependencyUris).size, restored.dependencyUris.length);
    } finally {
        [ManifestPackage.files, ManifestPackage.done, GenericServer.instance] = previous;
    }
});
