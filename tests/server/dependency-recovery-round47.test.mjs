import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }, { GenericServer }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

function makeManager(packages) {
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const key = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        const source = packages[key];
        if (!source) return undefined;
        return {
            name: source.name ?? key,
            dependencies: source.dependencies ?? {},
            file: { uri, contentUser: '' },
            loadWebComponents() { source.loads = (source.loads ?? 0) + 1; },
        };
    };
    return manager;
}

async function withState(callback) {
    const old = {
        files: ManifestPackage.files,
        done: ManifestPackage.done,
        server: GenericServer.instance,
    };
    const errors = [];
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    GenericServer.instance = { logLevel: 0, connection: { showErrorMessage: message => errors.push(message) } };
    try {
        return await callback(errors);
    } finally {
        ManifestPackage.files = old.files;
        ManifestPackage.done = old.done;
        GenericServer.instance = old.server;
    }
}

const names = result => result.files.map(file => file.name);
const uriNames = uris => uris.map(uri => decodeURIComponent(uri).split('/').at(-1));

test('missing transitive package becomes available on the next resolution with the same manager', async () => {
    const packages = {
        'Aventus@Main': {},
        App: { dependencies: { Shared: { uri: '/Shared.package.avt', include: 'full' } } },
    };
    const manager = makeManager(packages);
    await withState(async () => {
        const config = { dependencies: { App: { uri: '/App.package.avt', include: 'full' } } };
        const build = { buildConfig: {} };
        const first = await manager.loadDependenciesFromBuild(config, build);
        assert.deepEqual(names(first), ['Aventus@Main', 'App']);
        assert.deepEqual(uriNames(first.dependencyFullUris), ['App.package.avt']);

        packages.Shared = {};
        const second = await manager.loadDependenciesFromBuild(config, build);
        assert.deepEqual(names(second), ['Aventus@Main', 'Shared', 'App']);
        assert.deepEqual(uriNames(second.dependencyFullUris), ['Shared.package.avt', 'App.package.avt']);
        assert.equal(new Set(second.dependencyUris).size, second.dependencyUris.length);
        assert.equal(packages.Shared.loads, 1);
    });
});

test('a corrected transitive version resolves without carrying a previous conflict into the new graph', async () => {
    const packages = {
        'Aventus@Main': {},
        SharedOne: { name: 'Shared' },
        SharedTwo: { name: 'Shared' },
        First: { dependencies: { Shared: { uri: '/SharedOne.package.avt', version: '1.2.3' } } },
        Second: { dependencies: { Shared: { uri: '/SharedTwo.package.avt', version: '2.0.0' } } },
    };
    const manager = makeManager(packages);
    await withState(async errors => {
        const config = { dependencies: {
            First: { uri: '/First.package.avt' },
            Second: { uri: '/Second.package.avt' },
        } };
        const build = { buildConfig: {} };
        const first = await manager.loadDependenciesFromBuild(config, build);
        assert.equal(names(first).filter(name => name === 'Shared').length, 1);
        assert.equal(first.files.find(file => file.name === 'Shared').file.uri.endsWith('SharedOne.package.avt'), true);
        assert.equal(errors.length, 1);
        assert.match(errors[0], /dependency Shared/);

        packages.Second.dependencies.Shared.version = '1.2.3';
        errors.length = 0;
        const second = await manager.loadDependenciesFromBuild(config, build);
        assert.equal(errors.length, 0);
        assert.deepEqual(new Set(names(second)), new Set(['Aventus@Main', 'Shared', 'First', 'Second']));
        assert.ok(names(second).indexOf('Aventus@Main') < names(second).indexOf('Shared'));
        assert.ok(names(second).indexOf('Shared') < names(second).indexOf('First'));
        assert.ok(names(second).indexOf('Shared') < names(second).indexOf('Second'));
        assert.equal(new Set(second.dependencyUris).size, second.dependencyUris.length);
    });
});
