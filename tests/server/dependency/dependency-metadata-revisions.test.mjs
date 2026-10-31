import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('dependency npm metadata follows configuration and package header revisions', async () => {
    const previous = [ManifestPackage.files, ManifestPackage.done];
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    const packages = {
        'Aventus@Main': { content: '' },
        Widget: { content: '// npm:@widget/from-header\n/* description:Initial widget */' },
    };
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        const name = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
        const entry = packages[name];
        if (!entry) return undefined;
        return {
            name, dependencies: {}, file: { uri, contentUser: entry.content },
            loadWebComponents() {},
        };
    };
    const dependency = { uri: '/Widget.package.avt', include: 'full', npm: '@widget/override' };
    const config = { dependencies: { Widget: dependency } };
    const resolve = async () => {
        const result = await manager.loadDependenciesFromBuild(config, { buildConfig: {} });
        assert.equal(result.cycle, undefined);
        assert.deepEqual(result.files.map(file => file.name), ['Aventus@Main', 'Widget']);
        assert.equal(result.dependencyFullUris.length, 1);
        assert.ok(result.dependencyFullUris[0].endsWith('/Widget.package.avt'));
        return result.files.at(-1);
    };

    try {
        const overridden = await resolve();
        assert.equal(overridden.npmUri, '@widget/override');
        assert.equal(overridden.description, 'Initial widget');

        delete dependency.npm;
        packages.Widget.content = '// npm:@widget/updated\n/* description:Updated widget */';
        const updated = await resolve();
        assert.notEqual(updated, overridden);
        assert.equal(updated.npmUri, '@widget/updated');
        assert.equal(updated.description, 'Updated widget');

        packages.Widget.content = 'export declare class Widget {}';
        const cleared = await resolve();
        assert.notEqual(cleared, updated);
        assert.equal(cleared.npmUri, '');
        assert.equal(cleared.description, '');
    } finally {
        [ManifestPackage.files, ManifestPackage.done] = previous;
    }
});
