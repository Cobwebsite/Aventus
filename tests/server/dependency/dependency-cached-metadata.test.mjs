import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'project/DependencyManager.ts', 'manifest/ManifestPackage.ts',
]);

test('reloading a cached package clears metadata when its headers disappear', async t => {
    const previous = { files: ManifestPackage.files, done: ManifestPackage.done };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    t.after(() => {
        ManifestPackage.files = previous.files;
        ManifestPackage.done = previous.done;
    });

    const main = {
        name: 'Aventus@Main', dependencies: {},
        file: { uri: '/Aventus@Main.package.avt', contentUser: '' },
        loadWebComponents() {},
    };
    const widget = {
        name: 'Widget', dependencies: {},
        file: { uri: '/Widget.package.avt', contentUser: '// npm:@widget/first\n/* description:First */' },
        loadWebComponents() {},
    };
    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) =>
        decodeURIComponent(uri).endsWith('/Widget.package.avt') ? widget : main;
    const dependency = { uri: '/Widget.package.avt', include: 'full' };
    const config = { dependencies: { Widget: dependency } };
    const resolve = async () => {
        const result = await manager.loadDependenciesFromBuild(config, { buildConfig: {} });
        assert.equal(result.cycle, undefined);
        assert.deepEqual(result.files.map(file => file.name), ['Aventus@Main', 'Widget']);
        assert.equal(result.files.at(-1), widget);
        assert.equal(result.dependencyFullUris.length, 1);
        return widget;
    };

    await resolve();
    assert.equal(widget.npmUri, '@widget/first');
    assert.equal(widget.description, 'First');

    dependency.npm = '@widget/configured';
    widget.file.contentUser = '// npm:@widget/second\n/* description:Second */';
    await resolve();
    assert.equal(widget.npmUri, '@widget/configured');
    assert.equal(widget.description, 'Second');

    delete dependency.npm;
    await resolve();
    assert.equal(widget.npmUri, '@widget/second');

    widget.file.contentUser = 'export declare class Widget {}';
    await resolve();
    assert.equal(widget.npmUri, '');
    assert.equal(widget.description, '');
});
