import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }, { GenericServer }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('one dependency manager keeps alternating builds and their revised branches isolated', async () => {
    const previous = [ManifestPackage.files, ManifestPackage.done, GenericServer.instance];
    const sources = new Map([
        ['/Main.package.avt', { name: 'Aventus@Main', dependencies: {} }],
        ['/First.package.avt', { name: 'First', dependencies: { Shared: { uri: '/Shared.package.avt', include: 'full' } } }],
        ['/Second.package.avt', { name: 'Second', dependencies: { Shared: { uri: '/Shared.package.avt', include: 'full' } } }],
        ['/Shared.package.avt', { name: 'Shared', revision: 1, dependencies: { Old: { uri: '/Old.package.avt' } } }],
        ['/Old.package.avt', { name: 'Old', dependencies: {} }],
        ['/New.package.avt', { name: 'New', dependencies: {} }],
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
        const firstConfig = { dependencies: { First: { uri: '/First.package.avt', include: 'full' } } };
        const secondConfig = { dependencies: { Second: { uri: '/Second.package.avt', include: 'need' } } };
        const resolve = config => manager.loadDependenciesFromBuild(config, { buildConfig: {} });
        const names = result => result.files.map(file => file.name);
        const paths = uris => uris.map(uri => [...sources.keys()].find(path => decodeURIComponent(uri).endsWith(path)));

        const first = await resolve(firstConfig);
        assert.deepEqual(new Set(names(first)), new Set(['Aventus@Main', 'First', 'Shared', 'Old']));
        assert.deepEqual(paths(first.dependencyFullUris), ['/Shared.package.avt', '/First.package.avt']);

        const second = await resolve(secondConfig);
        assert.deepEqual(new Set(names(second)), new Set(['Aventus@Main', 'Second', 'Shared', 'Old']));
        assert.equal(paths(second.dependencyUris).includes('/First.package.avt'), false);
        assert.deepEqual(paths(second.dependencyNeedUris), ['/Main.package.avt', '/Old.package.avt', '/Second.package.avt']);
        assert.deepEqual(paths(second.dependencyFullUris), ['/Shared.package.avt']);

        sources.set('/Shared.package.avt', { name: 'Shared', revision: 2, dependencies: { New: { uri: '/New.package.avt' } } });
        const firstRevised = await resolve(firstConfig);
        assert.deepEqual(new Set(names(firstRevised)), new Set(['Aventus@Main', 'First', 'Shared', 'New']));
        assert.equal(firstRevised.files.find(file => file.name === 'Shared').revision, 2);
        assert.equal(paths(firstRevised.dependencyUris).includes('/Old.package.avt'), false);

        const secondRevised = await resolve(secondConfig);
        assert.deepEqual(new Set(names(secondRevised)), new Set(['Aventus@Main', 'Second', 'Shared', 'New']));
        assert.equal(paths(secondRevised.dependencyUris).includes('/First.package.avt'), false);
        assert.equal(paths(secondRevised.dependencyUris).includes('/Old.package.avt'), false);
        assert.equal(new Set(secondRevised.dependencyUris).size, secondRevised.dependencyUris.length);
    } finally {
        [ManifestPackage.files, ManifestPackage.done, GenericServer.instance] = previous;
    }
});
