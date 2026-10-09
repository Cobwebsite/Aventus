import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { Build }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts',
]);

test('project forgets a deleted global style and unregisters its delete listener', async () => {
    const project = Object.create(Project.prototype);
    const uri = 'file:///D:/app/theme.gs.avt';
    const calls = [];
    const file = { uri, removeOnDelete: id => calls.push(id) };
    project.scssFiles = { [uri]: { file } };
    project.onFileDeleteUUIDs = { [uri]: 'listener-global' };

    await project.onFileDelete(file);

    assert.deepEqual(calls, ['listener-global']);
    assert.deepEqual(project.scssFiles, {});
    assert.deepEqual(project.onFileDeleteUUIDs, {});
});

test('build deletes each file category before asking for a rebuild', async () => {
    const extensions = [
        ['style.wcs.avt', 'scssFiles'],
        ['view.wcv.avt', 'htmlFiles'],
        ['widget.wc.avt', 'wcFiles'],
        ['logic.lib.avt', 'tsFiles'],
    ];
    for (const [name, category] of extensions) {
        const uri = `file:///D:/app/src/${name}`;
        const calls = [];
        const build = Object.create(Build.prototype);
        build.scssFiles = { [uri]: { name: 'style' } };
        build.htmlFiles = { [uri]: { name: 'view' } };
        build.wcFiles = { [uri]: { name: 'widget' } };
        build.tsFiles = { [uri]: { name: 'logic' } };
        build.onFileDeleteUUIDs = { [uri]: 'listener' };
        build.rebuildAll = async () => calls.push('rebuild');
        const file = { uri, removeOnDelete: id => calls.push(`remove:${id}`) };

        await build.onFileDelete(file);

        assert.deepEqual(calls, ['remove:listener', 'rebuild'], name);
        assert.equal(Object.hasOwn(build[category], uri), false, name);
        assert.deepEqual(build.onFileDeleteUUIDs, {}, name);
    }
});

test('build resolves local tag dependencies and marks external definitions as external', () => {
    const build = Object.create(Build.prototype);
    build.buildConfig = { module: 'Catalog' };
    build.htmlLanguageService = {
        getInternalTagUri: tag => tag === 'local-card'
            ? { fullname: 'Catalog.UI.Card', uri: 'file:///D:/app/card.wc.avt' }
            : null,
    };
    build.getWebComponentDefinition = tag => tag === 'external-card'
        ? { class: { fullName: 'Widgets.Card', fileUri: 'file:///D:/deps/card.package.avt' }, isLocal: false }
        : undefined;

    assert.deepEqual(build.getWebComponentTagDependency('local-card'), {
        fullName: '$namespace$UI.Card', uri: 'file:///D:/app/card.wc.avt', isStrong: false,
    });
    assert.deepEqual(build.getWebComponentTagDependency('external-card'), {
        fullName: 'Widgets.Card', uri: '@external', isStrong: false,
    });
    assert.equal(build.getWebComponentTagDependency('missing-card'), null);
});
