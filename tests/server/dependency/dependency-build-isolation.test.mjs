import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('successive builds resolve their own dependency inclusion and i18n package', async () => {
    const packages = {
        'Aventus@Main': {},
        'Aventus@I18n': {},
        Shared: {},
    };
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = {
        'Aventus@Main': '/Aventus@Main.package.avt',
        'Aventus@I18n': '/Aventus@I18n.package.avt',
    };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const name = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        if (!packages[name]) return undefined;
        return {
            name,
            dependencies: {},
            file: { uri, contentUser: '' },
            loadWebComponents() { packages[name].loads = (packages[name].loads ?? 0) + 1; },
        };
    };
    const previousFiles = ManifestPackage.files;
    const previousDone = ManifestPackage.done;
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    try {
        const first = await manager.loadDependenciesFromBuild({ dependencies: {
            Shared: { uri: '/Shared.package.avt', include: 'full' },
        } }, { buildConfig: {} });
        const second = await manager.loadDependenciesFromBuild({ dependencies: {
            Shared: { uri: '/Shared.package.avt', include: 'none' },
        } }, { buildConfig: { i18n: {} } });

        const names = result => result.files.map(file => file.name);
        const filenames = uris => uris.map(uri => decodeURIComponent(uri).split('/').at(-1));
        assert.deepEqual(names(first), ['Aventus@Main', 'Shared']);
        assert.deepEqual(filenames(first.dependencyFullUris), ['Shared.package.avt']);
        assert.deepEqual(names(second), ['Aventus@Main', 'Aventus@I18n', 'Shared']);
        assert.deepEqual(filenames(second.dependencyFullUris), []);
        assert.deepEqual(filenames(second.dependencyNeedUris), [
            'Aventus@Main.package.avt', 'Aventus@I18n.package.avt',
        ]);
        assert.equal(packages.Shared.loads, 2);
    } finally {
        ManifestPackage.files = previousFiles;
        ManifestPackage.done = previousDone;
    }
});
