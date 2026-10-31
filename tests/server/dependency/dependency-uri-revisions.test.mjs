import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }, { GenericServer }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('changing a dependency URI on the same build replaces its package and URI lists', async () => {
    const originalFiles = ManifestPackage.files;
    const originalDone = ManifestPackage.done;
    const originalServer = GenericServer.instance;
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    const revisions = {
        '/first/Feature.package.avt': 1,
        '/second/Feature.package.avt': 2,
    };
    manager.loadByUri = async (_build, uri) => {
        const pathname = '/' + decodeURIComponent(new URL(uri).pathname).replace(/^\/+/, '').replace(/^[A-Za-z]:/, '');
        const revision = revisions[pathname];
        if (pathname !== '/Aventus@Main.package.avt' && !revision) return undefined;
        return {
            name: pathname === '/Aventus@Main.package.avt' ? 'Aventus@Main' : 'Feature',
            revision,
            dependencies: {},
            file: { uri, contentUser: '' },
            loadWebComponents() {},
        };
    };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    GenericServer.instance = { logLevel: 0, connection: { showErrorMessage() {} } };
    try {
        const config = { dependencies: { Feature: { uri: '/first/Feature.package.avt', include: 'full' } } };
        const build = { buildConfig: {} };
        const first = await manager.loadDependenciesFromBuild(config, build);
        assert.equal(first.files.find(file => file.name === 'Feature').revision, 1);
        assert.deepEqual(first.dependencyFullUris.map(uri => '/' + new URL(uri).pathname.replace(/^\/+/, '')), ['/first/Feature.package.avt']);

        config.dependencies.Feature.uri = '/second/Feature.package.avt';
        const second = await manager.loadDependenciesFromBuild(config, build);
        assert.equal(second.files.find(file => file.name === 'Feature').revision, 2);
        assert.deepEqual(second.dependencyFullUris.map(uri => '/' + new URL(uri).pathname.replace(/^\/+/, '')), ['/second/Feature.package.avt']);
        assert.equal(second.dependencyNeedUris.length, 1);
        assert.deepEqual(second.dependencyUris, [...second.dependencyNeedUris, ...second.dependencyFullUris]);

        delete revisions['/second/Feature.package.avt'];
        const missing = await manager.loadDependenciesFromBuild(config, build);
        assert.deepEqual(missing.files.map(file => file.name), ['Aventus@Main']);
        assert.deepEqual(missing.dependencyFullUris, []);
        assert.deepEqual(missing.dependencyUris, [missing.dependencyNeedUris[0]]);
    } finally {
        ManifestPackage.files = originalFiles;
        ManifestPackage.done = originalDone;
        GenericServer.instance = originalServer;
    }
});
