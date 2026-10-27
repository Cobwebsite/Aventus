import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('competing package versions retain only the selected transitive branch after edits', async t => {
    const previous = { files: ManifestPackage.files, done: ManifestPackage.done };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    t.after(() => {
        ManifestPackage.files = previous.files;
        ManifestPackage.done = previous.done;
    });

    const packages = {
        'Aventus@Main': { name: 'Aventus@Main', dependencies: {} },
        Loose: { name: 'Loose', dependencies: { Shared: { uri: '/SharedLoose.package.avt', version: '1.x.x' } } },
        Exact: { name: 'Exact', dependencies: { Shared: { uri: '/SharedExact.package.avt', version: '1.2.3' } } },
        SharedLoose: { name: 'Shared', dependencies: { LooseLeaf1: { uri: '/LooseLeaf1.package.avt' } } },
        SharedExact: { name: 'Shared', dependencies: { ExactLeaf1: { uri: '/ExactLeaf1.package.avt' } } },
        LooseLeaf1: { name: 'LooseLeaf1', dependencies: {} },
        LooseLeaf2: { name: 'LooseLeaf2', dependencies: {} },
        ExactLeaf1: { name: 'ExactLeaf1', dependencies: {} },
        ExactLeaf2: { name: 'ExactLeaf2', dependencies: {} },
    };
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const key = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        const entry = packages[key];
        return entry && {
            name: entry.name, dependencies: entry.dependencies,
            file: { uri, contentUser: '' }, loadWebComponents() {},
        };
    };
    const config = { dependencies: {
        Loose: { uri: '/Loose.package.avt' },
        Exact: { uri: '/Exact.package.avt' },
    } };
    const resolve = () => manager.loadDependenciesFromBuild(config, { buildConfig: {} });
    const names = result => result.files.map(file => file.name);
    const selected = result => result.files.find(file => file.name === 'Shared').file.uri;

    const initial = await resolve();
    assert.equal(initial.cycle, undefined);
    assert.ok(selected(initial).endsWith('SharedExact.package.avt'));
    assert.ok(!names(initial).includes('LooseLeaf1'));
    assert.ok(names(initial).includes('ExactLeaf1'));

    packages.SharedLoose.dependencies = { LooseLeaf2: { uri: '/LooseLeaf2.package.avt' } };
    packages.SharedExact.dependencies = { ExactLeaf2: { uri: '/ExactLeaf2.package.avt' } };
    const edited = await resolve();
    assert.equal(edited.cycle, undefined);
    assert.ok(selected(edited).endsWith('SharedExact.package.avt'));
    assert.ok(!names(edited).includes('LooseLeaf2'));
    assert.ok(names(edited).includes('ExactLeaf2'));
    assert.ok(!names(edited).includes('LooseLeaf1'));
    assert.ok(!names(edited).includes('ExactLeaf1'));
    assert.equal(names(edited).filter(name => name === 'Shared').length, 1);

    delete config.dependencies.Exact;
    const looseOnly = await resolve();
    assert.ok(selected(looseOnly).endsWith('SharedLoose.package.avt'));
    assert.ok(names(looseOnly).includes('LooseLeaf2'));
    assert.ok(!names(looseOnly).includes('ExactLeaf2'));

    config.dependencies.Exact = { uri: '/Exact.package.avt' };
    const restored = await resolve();
    assert.ok(selected(restored).endsWith('SharedExact.package.avt'));
    assert.ok(!names(restored).includes('LooseLeaf2'));
    assert.ok(names(restored).includes('ExactLeaf2'));
    assert.equal(restored.dependencyUris.length, restored.files.length);
});
