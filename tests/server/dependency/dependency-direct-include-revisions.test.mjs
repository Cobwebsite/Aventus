import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }, { GenericServer }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('a direct dependency changes full, transitive need, and none inclusion across builds', async () => {
    const previous = [ManifestPackage.files, ManifestPackage.done, GenericServer.instance];
    const sources = new Map([
        ['/Main.package.avt', { name: 'Aventus@Main', dependencies: {} }],
        ['/Parent.package.avt', { name: 'Parent', dependencies: { Shared: { uri: '/Shared.package.avt', include: 'need' } } }],
        ['/Shared.package.avt', { name: 'Shared', dependencies: {} }],
    ]);
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const source = [...sources].find(([path]) => decodeURIComponent(uri).endsWith(path))?.[1];
        return source && { ...source, file: { uri, contentUser: '' }, loadWebComponents() {} };
    };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    GenericServer.instance = { logLevel: 0, connection: { showErrorMessage() {} } };
    try {
        const parent = { uri: '/Parent.package.avt', include: 'need' };
        const shared = include => ({ uri: '/Shared.package.avt', include });
        const resolve = dependencies => manager.loadDependenciesFromBuild({ dependencies }, { buildConfig: {} });
        const names = result => result.files.map(file => file.name);
        const hasShared = uris => uris.some(uri => decodeURIComponent(uri).endsWith('/Shared.package.avt'));

        const full = await resolve({ Parent: parent, Shared: shared('full') });
        assert.deepEqual(new Set(names(full)), new Set(['Aventus@Main', 'Parent', 'Shared']));
        assert.equal(hasShared(full.dependencyFullUris), true);
        assert.equal(hasShared(full.dependencyNeedUris), false);

        const transitive = await resolve({ Parent: parent });
        assert.deepEqual(new Set(names(transitive)), new Set(['Aventus@Main', 'Parent', 'Shared']));
        assert.equal(hasShared(transitive.dependencyFullUris), false);
        assert.equal(hasShared(transitive.dependencyNeedUris), true);

        const excluded = await resolve({ Parent: parent, Shared: shared('none') });
        assert.deepEqual(new Set(names(excluded)), new Set(['Aventus@Main', 'Parent', 'Shared']));
        assert.equal(hasShared(excluded.dependencyUris), false);
        assert.equal(new Set(excluded.dependencyUris).size, excluded.dependencyUris.length);
    } finally {
        [ManifestPackage.files, ManifestPackage.done, GenericServer.instance] = previous;
    }
});
