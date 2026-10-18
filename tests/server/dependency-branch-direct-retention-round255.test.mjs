import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('a direct dependency survives replacement and removal of its transitive branch', async t => {
    const previous = { files: ManifestPackage.files, done: ManifestPackage.done };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    t.after(() => {
        ManifestPackage.files = previous.files;
        ManifestPackage.done = previous.done;
    });

    const packages = {
        'Aventus@Main': { dependencies: {} },
        Root: { dependencies: { Shared: { uri: '/Shared.package.avt' } } },
        Shared: { dependencies: {} },
        Alternate: { dependencies: {} },
    };
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const name = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        const entry = packages[name];
        return entry && {
            name, revision: entry.revision ?? 1, dependencies: entry.dependencies,
            file: { uri, contentUser: '' }, loadWebComponents() {},
        };
    };
    const config = { dependencies: {
        Root: { uri: '/Root.package.avt', include: 'full' },
        Shared: { uri: '/Shared.package.avt', include: 'full' },
    } };
    const resolve = () => manager.loadDependenciesFromBuild(config, { buildConfig: {} });
    const check = (result, expected, sharedFull = true) => {
        assert.equal(result.cycle, undefined);
        assert.deepEqual(new Set(result.files.map(file => file.name)), new Set(expected));
        assert.equal(result.files.length, expected.length);
        assert.equal(new Set(result.dependencyUris).size, result.dependencyUris.length);
        assert.ok(result.files.findIndex(file => file.name === 'Aventus@Main') <
            result.files.findIndex(file => file.name === 'Root'));
        assert.equal(result.dependencyFullUris.some(uri => uri.endsWith('/Shared.package.avt')),
            expected.includes('Shared') && sharedFull);
    };

    check(await resolve(), ['Aventus@Main', 'Root', 'Shared']);
    packages.Root.dependencies = { Alternate: { uri: '/Alternate.package.avt' } };
    packages.Shared.revision = 2;
    const changedBranch = await resolve();
    check(changedBranch, ['Aventus@Main', 'Root', 'Shared', 'Alternate']);
    assert.equal(changedBranch.files.find(file => file.name === 'Shared').revision, 2);
    assert.ok(changedBranch.files.findIndex(file => file.name === 'Alternate') <
        changedBranch.files.findIndex(file => file.name === 'Root'));

    delete config.dependencies.Shared;
    check(await resolve(), ['Aventus@Main', 'Root', 'Alternate']);
    packages.Root.dependencies = { Shared: { uri: '/Shared.package.avt' } };
    const transitiveAgain = await resolve();
    check(transitiveAgain, ['Aventus@Main', 'Root', 'Shared'], false);
    assert.ok(transitiveAgain.dependencyNeedUris.some(uri => uri.endsWith('/Shared.package.avt')));
    assert.ok(!transitiveAgain.dependencyFullUris.some(uri => uri.endsWith('/Shared.package.avt')));
});
