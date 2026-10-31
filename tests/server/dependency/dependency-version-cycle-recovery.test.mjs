import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('a version-selected cycle clears after the exact branch is removed', async t => {
    const previous = { files: ManifestPackage.files, done: ManifestPackage.done };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    t.after(() => {
        ManifestPackage.files = previous.files;
        ManifestPackage.done = previous.done;
    });

    const entries = {
        'Aventus@Main': { name: 'Aventus@Main', dependencies: {} },
        App: { name: 'App', dependencies: { Shared: { uri: '/SharedLoose.package.avt', version: '1.x.x' } } },
        Exact: { name: 'Exact', dependencies: { Shared: { uri: '/SharedExact.package.avt', version: '1.2.3' } } },
        SharedLoose: { name: 'Shared', dependencies: {} },
        SharedExact: { name: 'Shared', dependencies: { App: { uri: '/App.package.avt' } } },
    };
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const key = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        const entry = entries[key];
        return entry && {
            name: entry.name, dependencies: entry.dependencies,
            file: { uri, contentUser: '' }, loadWebComponents() {},
        };
    };
    const config = { dependencies: { App: { uri: '/App.package.avt' } } };
    const resolve = () => manager.loadDependenciesFromBuild(config, { buildConfig: {} });

    const initial = await resolve();
    assert.equal(initial.cycle, undefined);
    assert.deepEqual(initial.files.map(file => file.name), ['Aventus@Main', 'Shared', 'App']);
    assert.ok(initial.files.find(file => file.name === 'Shared').file.uri.endsWith('SharedLoose.package.avt'));

    config.dependencies.Exact = { uri: '/Exact.package.avt' };
    const cyclic = await resolve();
    assert.deepEqual(cyclic.cycle, ['App', 'Shared', 'App']);
    assert.deepEqual(cyclic.files, []);
    assert.deepEqual(cyclic.dependencyUris, []);

    delete config.dependencies.Exact;
    const recovered = await resolve();
    assert.equal(recovered.cycle, undefined);
    assert.deepEqual(recovered.files.map(file => file.name), ['Aventus@Main', 'Shared', 'App']);
    assert.ok(recovered.files.find(file => file.name === 'Shared').file.uri.endsWith('SharedLoose.package.avt'));
    assert.equal(recovered.dependencyUris.length, 3);
});
