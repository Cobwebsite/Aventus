import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('version replacement updates the selected package branch on subsequent resolutions', async t => {
    const previousFiles = ManifestPackage.files;
    const previousDone = ManifestPackage.done;
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    t.after(() => {
        ManifestPackage.files = previousFiles;
        ManifestPackage.done = previousDone;
    });

    const packages = {
        'Aventus@Main': { name: 'Aventus@Main', dependencies: {} },
        Loose: { name: 'Loose', dependencies: { Shared: { uri: '/SharedLoose.package.avt', version: '1.x.x' } } },
        Exact: { name: 'Exact', dependencies: { Shared: { uri: '/SharedExact.package.avt', version: '1.2.3' } } },
        SharedLoose: { name: 'Shared', dependencies: { OldLeaf: { uri: '/OldLeaf.package.avt' } } },
        SharedExact: { name: 'Shared', dependencies: { NewLeaf: { uri: '/NewLeaf.package.avt' } } },
        OldLeaf: { name: 'OldLeaf', dependencies: {} },
        NewLeaf: { name: 'NewLeaf', dependencies: {} },
    };
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const name = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        const entry = packages[name];
        return entry && {
            name: entry.name,
            dependencies: entry.dependencies,
            file: { uri, contentUser: '' },
            loadWebComponents() {},
        };
    };
    const config = { dependencies: {
        Loose: { uri: '/Loose.package.avt' },
        Exact: { uri: '/Exact.package.avt' },
    } };
    const names = result => result.files.map(file => file.name);
    const resolve = () => manager.loadDependenciesFromBuild(config, { buildConfig: {} });

    const exact = await resolve();
    assert.equal(exact.files.find(file => file.name === 'Shared').file.uri.endsWith('SharedExact.package.avt'), true);
    assert.ok(names(exact).includes('NewLeaf'));
    assert.ok(names(exact).includes('OldLeaf'));
    assert.equal(names(exact).filter(name => name === 'Shared').length, 1);
    assert.ok(exact.dependencyUris.some(uri => uri.endsWith('OldLeaf.package.avt')));

    delete config.dependencies.Exact;
    const loose = await resolve();
    assert.equal(loose.files.find(file => file.name === 'Shared').file.uri.endsWith('SharedLoose.package.avt'), true);
    assert.ok(names(loose).includes('OldLeaf'));
    assert.ok(!names(loose).includes('NewLeaf'));

    config.dependencies.Exact = { uri: '/Exact.package.avt' };
    const exactAgain = await resolve();
    assert.equal(exactAgain.files.find(file => file.name === 'Shared').file.uri.endsWith('SharedExact.package.avt'), true);
    assert.ok(names(exactAgain).includes('NewLeaf'));
    assert.ok(names(exactAgain).includes('OldLeaf'));
});
