import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('a shared diamond recovers from a cycle and prunes a removed branch on one manager', async () => {
    const definitions = {
        'Aventus@Main': {},
        Shared: {},
        Left: { Shared: { uri: '/Shared.package.avt' } },
        Right: { Shared: { uri: '/Shared.package.avt' } },
        Root: {
            Left: { uri: '/Left.package.avt' },
            Right: { uri: '/Right.package.avt' },
        },
    };
    const loads = new Map();
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const name = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        if (!Object.hasOwn(definitions, name)) return undefined;
        return {
            name, dependencies: definitions[name], file: { uri, contentUser: '' },
            loadWebComponents() { loads.set(name, (loads.get(name) ?? 0) + 1); },
        };
    };
    const previous = [ManifestPackage.files, ManifestPackage.done];
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    try {
        const config = { dependencies: { Root: { uri: '/Root.package.avt', include: 'full' } } };
        const build = { buildConfig: {} };
        const resolve = () => manager.loadDependenciesFromBuild(config, build);
        const assertGraph = (result, expected) => {
            assert.equal(result.cycle, undefined);
            const names = result.files.map(file => file.name);
            assert.deepEqual(new Set(names), new Set(expected));
            assert.equal(names.length, expected.length);
            for (const [parent, children] of Object.entries(definitions)) {
                if (!names.includes(parent)) continue;
                for (const child of Object.keys(children)) {
                    if (names.includes(child)) assert.ok(names.indexOf(child) < names.indexOf(parent), `${child} before ${parent}`);
                }
            }
            assert.equal(result.dependencyUris.length, expected.length);
            assert.equal(new Set(result.dependencyUris).size, expected.length);
            assert.equal(result.dependencyFullUris.length, 1);
            assert.ok(result.dependencyFullUris[0].endsWith('Root.package.avt'));
        };

        assertGraph(await resolve(), ['Aventus@Main', 'Shared', 'Left', 'Right', 'Root']);
        const beforeCycle = new Map(loads);

        definitions.Shared.Root = { uri: '/Root.package.avt' };
        const cyclic = await resolve();
        assert.deepEqual(cyclic.cycle, ['Root', 'Left', 'Shared', 'Root']);
        assert.deepEqual(cyclic.files, []);
        assert.deepEqual(cyclic.dependencyUris, []);
        assert.deepEqual(loads, beforeCycle);

        delete definitions.Shared.Root;
        assertGraph(await resolve(), ['Aventus@Main', 'Shared', 'Left', 'Right', 'Root']);

        delete definitions.Root.Right;
        assertGraph(await resolve(), ['Aventus@Main', 'Shared', 'Left', 'Root']);
        assert.equal(loads.get('Right'), 2);
    } finally {
        [ManifestPackage.files, ManifestPackage.done] = previous;
    }
});
