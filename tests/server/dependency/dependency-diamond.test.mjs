import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('diamond graph emits each shared package once and keeps dependencies before both consumers', async () => {
    const definitions = {
        'Aventus@Main': {},
        Shared: {},
        Left: { Shared: { uri: '/Shared.package.avt', include: 'full' } },
        Right: { Shared: { uri: '/Shared.package.avt', include: 'full' } },
        App: {
            Left: { uri: '/Left.package.avt', include: 'full' },
            Right: { uri: '/Right.package.avt', include: 'full' },
        },
    };
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    const loads = new Map();
    manager.loadByUri = async (_build, uri) => {
        const name = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        if (!Object.hasOwn(definitions, name)) return undefined;
        return {
            name,
            dependencies: definitions[name],
            file: { uri, contentUser: '' },
            loadWebComponents() { loads.set(name, (loads.get(name) ?? 0) + 1); },
        };
    };
    const oldFiles = ManifestPackage.files;
    const oldDone = ManifestPackage.done;
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    try {
        const config = { dependencies: { App: { uri: '/App.package.avt', include: 'full' } } };
        const result = await manager.loadDependenciesFromBuild(config, { buildConfig: {} });
        const names = result.files.map(file => file.name);
        assert.equal(new Set(names).size, 5);
        assert.deepEqual(new Set(names), new Set(Object.keys(definitions)));
        for (const [before, after] of [
            ['Aventus@Main', 'Shared'], ['Shared', 'Left'], ['Shared', 'Right'],
            ['Left', 'App'], ['Right', 'App'],
        ]) assert.ok(names.indexOf(before) < names.indexOf(after), `${before} before ${after}: ${names}`);
        assert.deepEqual(Object.fromEntries(loads), Object.fromEntries(names.map(name => [name, 1])));
        assert.equal(new Set(result.dependencyUris).size, result.dependencyUris.length);
        assert.deepEqual(new Set(result.dependencyFullUris.map(uri => decodeURIComponent(uri).split('/').at(-1))),
            new Set(['Shared.package.avt', 'Left.package.avt', 'Right.package.avt', 'App.package.avt']));
    } finally {
        ManifestPackage.files = oldFiles;
        ManifestPackage.done = oldDone;
    }
});
