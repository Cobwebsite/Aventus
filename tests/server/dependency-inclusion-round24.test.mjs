import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }, { GenericServer }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

function managerWith(packages) {
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = {
        'Aventus@Main': '/Aventus@Main.package.avt',
        'Aventus@I18n': '/Aventus@I18n.package.avt',
    };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const name = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        const pkg = packages[name];
        if (!pkg) return undefined;
        return {
            name, dependencies: pkg.dependencies ?? {},
            file: { uri, contentUser: '' },
            loadWebComponents() { pkg.loads = (pkg.loads ?? 0) + 1; },
        };
    };
    return manager;
}

async function resolve(packages, dependencies, buildConfig = {}) {
    const manager = managerWith(packages);
    const oldFiles = ManifestPackage.files;
    const oldDone = ManifestPackage.done;
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    try {
        return await manager.loadDependenciesFromBuild({ dependencies }, { buildConfig });
    } finally {
        ManifestPackage.files = oldFiles;
        ManifestPackage.done = oldDone;
    }
}

const filenames = uris => uris.map(uri => decodeURIComponent(uri).split('/').at(-1));

test('none keeps a dependency available for analysis without adding its URI to generated imports', async () => {
    const packages = {
        'Aventus@Main': {},
        Hidden: {},
        Included: {},
    };
    const result = await resolve(packages, {
        Hidden: { uri: '/Hidden.package.avt', include: 'none' },
        Included: { uri: '/Included.package.avt', include: 'full' },
    });
    assert.deepEqual(result.files.map(file => file.name).sort(), ['Aventus@Main', 'Hidden', 'Included'].sort());
    assert.deepEqual(filenames(result.dependencyFullUris), ['Included.package.avt']);
    assert.deepEqual(filenames(result.dependencyNeedUris), ['Aventus@Main.package.avt']);
    assert.deepEqual(filenames(result.dependencyUris), ['Aventus@Main.package.avt', 'Included.package.avt']);
    assert.equal(packages.Hidden.loads, 1);
});

test('i18n build loads its built-in dependency once, after Main, even when explicitly configured', async () => {
    const packages = {
        'Aventus@Main': {},
        'Aventus@I18n': {},
    };
    const result = await resolve(packages, {
        'Aventus@I18n': { uri: '/ignored.package.avt', include: 'full' },
    }, { i18n: {} });
    assert.deepEqual(result.files.map(file => file.name), ['Aventus@Main', 'Aventus@I18n']);
    assert.deepEqual(filenames(result.dependencyFullUris), ['Aventus@I18n.package.avt']);
    assert.equal(packages['Aventus@I18n'].loads, 1);
});

test('transitive dependencies precede every consumer and occur only once across shared branches', async () => {
    const packages = {
        'Aventus@Main': {},
        Shared: {},
        First: { dependencies: { Shared: { uri: '/Shared.package.avt' } } },
        Second: { dependencies: { Shared: { uri: '/Shared.package.avt' } } },
    };
    const result = await resolve(packages, {
        First: { uri: '/First.package.avt' },
        Second: { uri: '/Second.package.avt' },
    });
    const names = result.files.map(file => file.name);
    assert.equal(names.length, 4);
    assert.equal(names.filter(name => name === 'Shared').length, 1);
    assert.ok(names.indexOf('Aventus@Main') < names.indexOf('Shared'));
    assert.ok(names.indexOf('Shared') < names.indexOf('First'));
    assert.ok(names.indexOf('Shared') < names.indexOf('Second'));
    assert.equal(packages.Shared.loads, 1);
});

test('a conflicting transitive version reports the package and retains the first resolved file', async () => {
    const packages = {
        'Aventus@Main': {},
        SharedOne: {},
        SharedTwo: {},
        First: { dependencies: { Shared: { uri: '/SharedOne.package.avt', version: '1.2.3' } } },
        Second: { dependencies: { Shared: { uri: '/SharedTwo.package.avt', version: '2.0.0' } } },
    };
    const instance = managerWith(packages);
    const originalLoad = instance.loadByUri;
    instance.loadByUri = async (build, uri) => {
        const pkg = await originalLoad(build, uri);
        if (pkg?.name?.startsWith('Shared')) pkg.name = 'Shared';
        return pkg;
    };
    const previousServer = GenericServer.instance;
    const previousFiles = ManifestPackage.files;
    const previousDone = ManifestPackage.done;
    const errors = [];
    GenericServer.instance = { logLevel: 0, connection: { showErrorMessage: text => errors.push(text) } };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    try {
        const result = await instance.loadDependenciesFromBuild({ dependencies: {
            First: { uri: '/First.package.avt' },
            Second: { uri: '/Second.package.avt' },
        } }, { buildConfig: {} });
        const shared = result.files.filter(file => file.name === 'Shared');
        assert.equal(shared.length, 1);
        assert.equal(shared[0].file.uri.endsWith('SharedOne.package.avt'), true);
        assert.ok(errors.some(message => message.includes('dependency Shared')));
    } finally {
        GenericServer.instance = previousServer;
        ManifestPackage.files = previousFiles;
        ManifestPackage.done = previousDone;
    }
});
