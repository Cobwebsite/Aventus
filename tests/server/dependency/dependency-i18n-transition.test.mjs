import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }, { GenericServer }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('the same dependency manager adds and removes built-in i18n across build revisions', async t => {
    const oldFiles = ManifestPackage.files;
    const oldDone = ManifestPackage.done;
    const oldServer = GenericServer.instance;
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    GenericServer.instance = { logLevel: 0, connection: { showErrorMessage() {} } };
    t.after(() => {
        ManifestPackage.files = oldFiles;
        ManifestPackage.done = oldDone;
        GenericServer.instance = oldServer;
    });

    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = {
        'Aventus@Main': '/Aventus@Main.package.avt',
        'Aventus@I18n': '/Aventus@I18n.package.avt',
    };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => ({
        name: decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', ''),
        dependencies: {}, file: { uri, contentUser: '' }, loadWebComponents() {},
    });
    const config = { dependencies: {} };
    const without = await manager.loadDependenciesFromBuild(config, { buildConfig: {} });
    assert.deepEqual(without.files.map(file => file.name), ['Aventus@Main']);

    const withI18n = await manager.loadDependenciesFromBuild(config, { buildConfig: { i18n: {} } });
    assert.deepEqual(withI18n.files.map(file => file.name), ['Aventus@Main', 'Aventus@I18n']);
    assert.equal(withI18n.dependencyNeedUris.length, 2);

    const removed = await manager.loadDependenciesFromBuild(config, { buildConfig: {} });
    assert.deepEqual(removed.files.map(file => file.name), ['Aventus@Main']);
    assert.equal(removed.dependencyUris.length, 1);
});
