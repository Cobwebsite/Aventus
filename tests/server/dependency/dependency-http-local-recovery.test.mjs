import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }, { GenericServer }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('an unsupported HTTP package leaves its sibling usable and can be replaced by a local package', async t => {
    const previous = {
        files: ManifestPackage.files,
        done: ManifestPackage.done,
        server: GenericServer.instance,
    };
    const errors = [];
    const loaded = [];
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    GenericServer.instance = { logLevel: 0, connection: { showErrorMessage: message => errors.push(message) } };
    t.after(() => {
        ManifestPackage.files = previous.files;
        ManifestPackage.done = previous.done;
        GenericServer.instance = previous.server;
    });

    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        loaded.push(uri);
        const name = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        return {
            name, dependencies: {}, file: { uri, contentUser: '' },
            loadWebComponents() {},
        };
    };
    const config = { dependencies: {
        Remote: { uri: 'https://example.invalid/Remote.package.avt', include: 'full' },
        Sibling: { uri: '/Sibling.package.avt', include: 'full' },
    } };
    const resolve = () => manager.loadDependenciesFromBuild(config, { buildConfig: {} });

    const unsupported = await resolve();
    assert.equal(unsupported.cycle, undefined);
    assert.deepEqual(unsupported.files.map(file => file.name), ['Aventus@Main', 'Sibling']);
    assert.deepEqual(unsupported.dependencyFullUris.map(uri => decodeURIComponent(uri).split('/').at(-1)),
        ['Sibling.package.avt']);
    assert.equal(loaded.some(uri => uri.includes('Remote.package.avt')), false);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /http package isn't supported/);

    config.dependencies.Remote.uri = '/Remote.package.avt';
    errors.length = 0;
    const repaired = await resolve();
    assert.equal(repaired.cycle, undefined);
    assert.deepEqual(new Set(repaired.files.map(file => file.name)),
        new Set(['Aventus@Main', 'Remote', 'Sibling']));
    assert.deepEqual(new Set(repaired.dependencyFullUris.map(uri => decodeURIComponent(uri).split('/').at(-1))),
        new Set(['Remote.package.avt', 'Sibling.package.avt']));
    assert.equal(new Set(repaired.dependencyUris).size, repaired.dependencyUris.length);
    assert.equal(errors.length, 0);
});
