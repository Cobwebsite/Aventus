import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

function fixture(packages) {
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = {};
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const pkg = packages[Object.keys(packages).find(name => decodeURIComponent(uri).endsWith(`${name}.package.avt`))];
        if (!pkg) return undefined;
        return {
            name: pkg.name,
            dependencies: pkg.dependencies ?? {},
            file: { uri, contentUser: pkg.content ?? '' },
            loadWebComponents() { pkg.loads = (pkg.loads ?? 0) + 1; },
        };
    };
    return manager;
}

test('explicit package URI resolves transitive imports, metadata and runtime ordering', async () => {
    const packages = {
        App: { name: 'App', dependencies: { Shared: { uri: '/Shared.package.avt', include: 'full' } }, content: '// npm:@example/app\n/* description:Application */' },
        Shared: { name: 'Shared', content: '// npm:@example/shared' },
        'Aventus@Main': { name: 'Aventus@Main' },
    };
    const manager = fixture(packages);
    manager.predefinedPaths['Aventus@Main'] = '/Aventus@Main.package.avt';
    const previousFiles = ManifestPackage.files;
    const previousDone = ManifestPackage.done;
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    try {
        const result = await manager.loadDependenciesFromBuild({ dependencies: {
            App: { uri: '/App.package.avt', include: 'full' },
        } }, { buildConfig: {} });
        assert.deepEqual(result.files.map(file => file.name), ['Aventus@Main', 'Shared', 'App']);
        assert.deepEqual(result.dependencyFullUris.map(uri => uri.split('/').at(-1)), ['Shared.package.avt', 'App.package.avt']);
        assert.deepEqual(result.dependencyNeedUris.map(uri => decodeURIComponent(uri).split('/').at(-1)), ['Aventus@Main.package.avt']);
        assert.equal(result.files.at(-1).npmUri, '@example/app');
        assert.equal(result.files.at(-1).description, 'Application');
        assert.deepEqual(Object.keys(ManifestPackage.files).map(uri => decodeURIComponent(uri).split('/').at(-1)).sort(), [
            'App.package.avt', 'Aventus@Main.package.avt', 'Shared.package.avt',
        ].sort());
        assert.equal(packages.Shared.loads, 1);
    } finally {
        ManifestPackage.files = previousFiles;
        ManifestPackage.done = previousDone;
    }
});

test('unloadable explicit package is omitted while other packages remain available', async () => {
    const packages = {
        Available: { name: 'Available' },
        'Aventus@Main': { name: 'Aventus@Main' },
    };
    const manager = fixture(packages);
    manager.predefinedPaths['Aventus@Main'] = '/Aventus@Main.package.avt';
    const previousFiles = ManifestPackage.files;
    const previousDone = ManifestPackage.done;
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    try {
        const result = await manager.loadDependenciesFromBuild({ dependencies: {
            Missing: { uri: '/Missing.package.avt', include: 'full' },
            Available: { uri: '/Available.package.avt', include: 'full', npm: '@example/override' },
        } }, { buildConfig: {} });
        assert.deepEqual(result.files.map(file => file.name), ['Aventus@Main', 'Available']);
        assert.deepEqual(result.dependencyFullUris.map(uri => uri.split('/').at(-1)), ['Available.package.avt']);
        assert.equal(result.files.at(-1).npmUri, '@example/override');
        assert.ok(Object.keys(ManifestPackage.files).every(uri => !uri.endsWith('Missing.package.avt')));
    } finally {
        ManifestPackage.files = previousFiles;
        ManifestPackage.done = previousDone;
    }
});

test('a later exact package version replaces an earlier wildcard resolution', async () => {
    const packages = { 'Aventus@Main': { name: 'Aventus@Main' } };
    const manager = fixture(packages);
    manager.predefinedPaths['Aventus@Main'] = '/Aventus@Main.package.avt';
    const originalLoad = manager.loadByUri;
    manager.loadByUri = async (build, uri) => {
        if (!uri.includes('shared-')) return originalLoad(build, uri);
        return { name: 'Shared', dependencies: {}, file: { uri, contentUser: '' }, loadWebComponents() {} };
    };
    const previousFiles = ManifestPackage.files;
    const previousDone = ManifestPackage.done;
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    try {
        const result = await manager.loadDependenciesFromBuild({ dependencies: {
            Loose: { uri: '/shared-wildcard.package.avt', version: '1.x.x' },
            Exact: { uri: '/shared-exact.package.avt', version: '1.2.3' },
        } }, { buildConfig: {} });
        assert.deepEqual(result.files.map(file => file.name), ['Aventus@Main', 'Shared']);
        assert.equal(result.files.at(-1).file.uri.endsWith('shared-exact.package.avt'), true);
        assert.equal(result.dependencyNeedUris.at(-1).endsWith('shared-exact.package.avt'), true);
    } finally {
        ManifestPackage.files = previousFiles;
        ManifestPackage.done = previousDone;
    }
});
