import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }, { GenericServer }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('two direct dependencies disappear and recover independently on one manager', async () => {
    const previous = [ManifestPackage.files, ManifestPackage.done, GenericServer.instance];
    const packages = {
        'Aventus@Main': { name: 'Aventus@Main', revision: 1 },
        Alpha: { name: 'Alpha', revision: 1 },
        Beta: { name: 'Beta', revision: 1 },
    };
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const name = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        const source = packages[name];
        return source && {
            ...source, dependencies: {}, file: { uri, contentUser: '' },
            loadWebComponents() {},
        };
    };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    GenericServer.instance = { logLevel: 0, connection: { showErrorMessage() {} } };
    try {
        const config = { dependencies: {
            Alpha: { uri: '/Alpha.package.avt', include: 'full' },
            Beta: { uri: '/Beta.package.avt', include: 'full' },
        } };
        const build = { buildConfig: {} };
        const resolve = () => manager.loadDependenciesFromBuild(config, build);
        const assertResult = (result, names) => {
            assert.equal(result.cycle, undefined);
            assert.deepEqual(new Set(result.files.map(file => file.name)), new Set(['Aventus@Main', ...names]));
            assert.equal(result.files.length, names.length + 1);
            assert.deepEqual(new Set(result.dependencyFullUris.map(uri => decodeURIComponent(uri).split('/').at(-1))),
                new Set(names.map(name => `${name}.package.avt`)));
            assert.equal(new Set(result.dependencyUris).size, result.dependencyUris.length);
            for (const name of ['Alpha', 'Beta']) {
                assert.equal(result.dependencyUris.some(uri => uri.endsWith(`/${name}.package.avt`)), names.includes(name));
            }
        };

        assertResult(await resolve(), ['Alpha', 'Beta']);
        delete packages.Alpha;
        assertResult(await resolve(), ['Beta']);
        delete packages.Beta;
        assertResult(await resolve(), []);
        packages.Alpha = { name: 'Alpha', revision: 2 };
        const oneRestored = await resolve();
        assertResult(oneRestored, ['Alpha']);
        assert.equal(oneRestored.files.find(file => file.name === 'Alpha').revision, 2);
        packages.Beta = { name: 'Beta', revision: 3 };
        const bothRestored = await resolve();
        assertResult(bothRestored, ['Alpha', 'Beta']);
        assert.equal(bothRestored.files.find(file => file.name === 'Alpha').revision, 2);
        assert.equal(bothRestored.files.find(file => file.name === 'Beta').revision, 3);
    } finally {
        [ManifestPackage.files, ManifestPackage.done, GenericServer.instance] = previous;
    }
});
