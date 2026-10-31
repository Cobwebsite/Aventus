import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }, { GenericServer }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

function fixture(packages) {
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

async function withManifest(callback) {
    const previous = { files: ManifestPackage.files, done: ManifestPackage.done };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    try { await callback(); }
    finally {
        ManifestPackage.files = previous.files;
        ManifestPackage.done = previous.done;
    }
}

const names = result => result.files.map(file => file.name);
const uriNames = uris => uris.map(uri => decodeURIComponent(uri).split('/').at(-1));

test('editing a package graph removes its old transitive dependency on the next resolution', async () => {
    const packages = {
        'Aventus@Main': {},
        App: { dependencies: { Old: { uri: '/Old.package.avt', include: 'full' } } },
        Old: {},
        New: {},
    };
    const manager = fixture(packages);
    const config = { dependencies: { App: { uri: '/App.package.avt', include: 'full' } } };
    const build = { buildConfig: {} };
    await withManifest(async () => {
        const first = await manager.loadDependenciesFromBuild(config, build);
        assert.deepEqual(names(first), ['Aventus@Main', 'Old', 'App']);
        assert.deepEqual(uriNames(first.dependencyFullUris), ['Old.package.avt', 'App.package.avt']);

        packages.App.dependencies = { New: { uri: '/New.package.avt', include: 'full' } };
        const second = await manager.loadDependenciesFromBuild(config, build);
        assert.deepEqual(names(second), ['Aventus@Main', 'New', 'App']);
        assert.deepEqual(uriNames(second.dependencyFullUris), ['New.package.avt', 'App.package.avt']);
        assert.equal(second.dependencyUris.some(uri => uri.endsWith('Old.package.avt')), false);
        assert.equal(packages.Old.loads, 1);
        assert.equal(packages.New.loads, 1);
    });
});

test('changing a direct package from local resolution to explicit URI replaces the selected file', async () => {
    const packages = { 'Aventus@Main': {}, Remote: { name: 'Feature' } };
    const manager = fixture(packages);
    const local = { name: 'Feature', dependencies: {}, file: { uri: 'file:///local/Feature.package.avt', contentUser: '' }, loadWebComponents() {} };
    let localCalls = 0;
    manager.loadLocal = async () => {
        localCalls++;
        return { file: local, uri: local.file.uri };
    };
    const config = { dependencies: { Feature: { isLocal: true, include: 'need' } } };
    const build = { buildConfig: {} };
    await withManifest(async () => {
        const first = await manager.loadDependenciesFromBuild(config, build);
        assert.deepEqual(names(first), ['Aventus@Main', 'Feature']);
        assert.equal(first.files[1], local);
        assert.equal(localCalls, 1);

        config.dependencies.Feature = { uri: '/Remote.package.avt', include: 'full' };
        const second = await manager.loadDependenciesFromBuild(config, build);
        assert.deepEqual(names(second), ['Aventus@Main', 'Feature']);
        assert.equal(second.files[1].file.uri.endsWith('Remote.package.avt'), true);
        assert.deepEqual(uriNames(second.dependencyFullUris), ['Remote.package.avt']);
        assert.equal(localCalls, 1);
    });
});

test('local, Store and explicit URI choices use the corresponding loader as config changes', async () => {
    const packages = { 'Aventus@Main': {}, Explicit: { name: 'Feature' } };
    const manager = fixture(packages);
    const calls = [];
    const packageFile = (uri) => ({
        name: 'Feature', dependencies: {}, file: { uri, contentUser: '' }, loadWebComponents() {},
    });
    manager.loadLocal = async name => {
        calls.push(['local', name]);
        return { uri: 'file:///local/Feature.package.avt', file: packageFile('file:///local/Feature.package.avt') };
    };
    manager.loadStore = async (name, version) => {
        calls.push(['store', name, version]);
        return { uri: 'file:///store/Feature.package.avt', file: packageFile('file:///store/Feature.package.avt') };
    };
    const config = { dependencies: { Feature: { isLocal: true } } };
    const build = { buildConfig: {} };
    await withManifest(async () => {
        const local = await manager.loadDependenciesFromBuild(config, build);
        assert.equal(local.files.at(-1).file.uri, 'file:///local/Feature.package.avt');
        config.dependencies.Feature = { version: '1.2.3' };
        const store = await manager.loadDependenciesFromBuild(config, build);
        assert.equal(store.files.at(-1).file.uri, 'file:///store/Feature.package.avt');
        config.dependencies.Feature = { uri: '/Explicit.package.avt', version: '1.2.3' };
        const explicit = await manager.loadDependenciesFromBuild(config, build);
        assert.equal(explicit.files.at(-1).file.uri.endsWith('Explicit.package.avt'), true);
        assert.deepEqual(calls, [['local', 'Feature'], ['store', 'Feature', '1.2.3']]);
    });
});

test('a Store dependency without version is omitted and reports the configuration error', async () => {
    const manager = fixture({ 'Aventus@Main': {} });
    let storeCalls = 0;
    manager.loadStore = async () => { storeCalls++; return undefined; };
    const previousServer = GenericServer.instance;
    const errors = [];
    GenericServer.instance = { logLevel: 0, connection: { showErrorMessage: message => errors.push(message) } };
    try {
        await withManifest(async () => {
            const result = await manager.loadDependenciesFromBuild({ dependencies: {
                Feature: { include: 'full' },
            } }, { buildConfig: {} });
            assert.deepEqual(names(result), ['Aventus@Main']);
            assert.equal(storeCalls, 0);
            assert.ok(errors.some(message => message.includes('version') && message.includes('Feature')));
        });
    } finally {
        GenericServer.instance = previousServer;
    }
});
