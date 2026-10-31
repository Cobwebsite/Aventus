import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('explicit i18n inclusion overrides the automatic dependency and resets after removal', async t => {
    const previous = [ManifestPackage.files, ManifestPackage.done];
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    t.after(() => { [ManifestPackage.files, ManifestPackage.done] = previous; });

    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = {
        'Aventus@Main': '/Main.package.avt',
        'Aventus@I18n': '/I18n.package.avt',
    };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => ({
        name: decodeURIComponent(uri).endsWith('/Main.package.avt') ? 'Aventus@Main' : 'Aventus@I18n',
        dependencies: {}, file: { uri, contentUser: '' }, loadWebComponents() {},
    });
    const config = { dependencies: { 'Aventus@I18n': { include: 'none' } } };
    const build = { buildConfig: { i18n: {} } };
    const resolve = () => manager.loadDependenciesFromBuild(config, build);
    const i18nUris = uris => uris.filter(uri => decodeURIComponent(uri).endsWith('/I18n.package.avt'));

    const excluded = await resolve();
    assert.deepEqual(excluded.files.map(file => file.name), ['Aventus@Main', 'Aventus@I18n']);
    assert.equal(i18nUris(excluded.dependencyUris).length, 0);

    config.dependencies['Aventus@I18n'].include = 'full';
    const full = await resolve();
    assert.equal(i18nUris(full.dependencyFullUris).length, 1);
    assert.equal(i18nUris(full.dependencyNeedUris).length, 0);

    delete config.dependencies['Aventus@I18n'];
    const automatic = await resolve();
    assert.deepEqual(automatic.files.map(file => file.name), ['Aventus@Main', 'Aventus@I18n']);
    assert.equal(i18nUris(automatic.dependencyNeedUris).length, 1);
    assert.equal(i18nUris(automatic.dependencyFullUris).length, 0);
    assert.equal(new Set(automatic.dependencyUris).size, automatic.dependencyUris.length);
});
