import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('a self-referencing package reports a cycle and recovers after the reference is removed', async () => {
    const dependencies = { Root: { uri: '/Root.package.avt' } };
    let loads = 0;
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const name = uri.split('/').at(-1).replace('.package.avt', '');
        if (!['Root', 'Aventus@Main'].includes(name)) return undefined;
        return {
            name, dependencies: name === 'Root' ? dependencies : {},
            file: { uri, contentUser: '' },
            loadWebComponents() { loads++; },
        };
    };
    const previous = [ManifestPackage.files, ManifestPackage.done];
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    try {
        const config = { dependencies: { Root: { uri: '/Root.package.avt', include: 'full' } } };
        const build = { buildConfig: {} };
        const cyclic = await manager.loadDependenciesFromBuild(config, build);
        assert.deepEqual(cyclic.cycle, ['Root', 'Root']);
        assert.deepEqual(cyclic.files, []);
        assert.deepEqual(cyclic.dependencyUris, []);
        assert.equal(loads, 0);

        delete dependencies.Root;
        const recovered = await manager.loadDependenciesFromBuild(config, build);
        assert.equal(recovered.cycle, undefined);
        assert.deepEqual(recovered.files.map(file => file.name), ['Root']);
        assert.equal(recovered.dependencyUris.length, 1);
        assert.ok(recovered.dependencyUris[0].endsWith('/Root.package.avt'));
        assert.equal(loads, 1);
    } finally {
        [ManifestPackage.files, ManifestPackage.done] = previous;
    }
});
