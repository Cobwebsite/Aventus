import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('two direct aliases for one package keep a single file but use the final include setting', async () => {
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const name = uri.endsWith('Aventus%40Main.package.avt') ? 'Aventus@Main' : 'Shared';
        return {
            name, dependencies: {}, file: { uri, contentUser: '' }, loadWebComponents() {},
        };
    };
    const previous = [ManifestPackage.files, ManifestPackage.done];
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    try {
        const resolve = dependencies => manager.loadDependenciesFromBuild({ dependencies }, { buildConfig: {} });
        const needLast = await resolve({
            First: { uri: '/Shared.package.avt', include: 'full' },
            Second: { uri: '/Shared.package.avt', include: 'need' },
        });
        assert.deepEqual(needLast.files.map(file => file.name), ['Aventus@Main', 'Shared']);
        assert.deepEqual(needLast.dependencyFullUris, []);
        assert.equal(needLast.dependencyNeedUris.length, 2);
        assert.equal(needLast.dependencyNeedUris.at(-1).endsWith('Shared.package.avt'), true);

        const fullLast = await resolve({
            Second: { uri: '/Shared.package.avt', include: 'need' },
            First: { uri: '/Shared.package.avt', include: 'full' },
        });
        assert.deepEqual(fullLast.files.map(file => file.name), ['Aventus@Main', 'Shared']);
        assert.equal(fullLast.dependencyFullUris.length, 1);
        assert.equal(fullLast.dependencyFullUris[0].endsWith('Shared.package.avt'), true);
        assert.equal(fullLast.dependencyNeedUris.some(uri => uri.endsWith('Shared.package.avt')), false);
    } finally {
        [ManifestPackage.files, ManifestPackage.done] = previous;
    }
});
