import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Project } = await loadServerModule('project/Project.ts');

function project() {
    const instance = Object.create(Project.prototype);
    instance.configFile = { uri: 'file:///D:/app/aventus.conf.avt', folderPath: 'D:\\app' };
    instance.config = { aliases: { '@src': 'src' } };
    instance.builds = [
        { fullname: 'app', hasStories: true, hasNpmOutput: false, isFileInside: uri => uri.includes('/src/') },
        { fullname: 'library', hasStories: false, hasNpmOutput: true, isFileInside: uri => uri.includes('/lib/') },
    ];
    instance.statics = [{ name: 'assets' }];
    return instance;
}

test('project resolves configured aliases relative to the current file', () => {
    const instance = project();
    assert.equal(instance.resolveAlias('@src/utils', 'D:\\app\\test'), '../src/utils');
    assert.equal(instance.resolveAlias('@src/utils', { folderPath: 'D:\\app\\src' }), './utils');
    assert.equal(instance.resolveAlias('@missing/utils', 'D:\\app\\test'), '@missing/utils');
    assert.equal(instance.resolveAlias('./local', 'D:\\app\\test'), './local');
});

test('project selects builds and static outputs by name and file path', () => {
    const instance = project();
    assert.deepEqual(instance.getBuildsName(), ['app', 'library']);
    assert.deepEqual(instance.getBuildsNameWithStory(), ['app']);
    assert.deepEqual(instance.getBuildsNameWithNpm(), ['library']);
    assert.equal(instance.getBuild('app'), instance.builds[0]);
    assert.equal(instance.getBuild('missing'), undefined);
    assert.deepEqual(instance.getMatchingBuildsByUri('file:///D:/app/src/view.wcl.avt'), [instance.builds[0]]);
    assert.deepEqual(instance.getMatchingBuildsByUri('file:///D:/app/other/file.wcl.avt'), []);
    assert.deepEqual(instance.getStaticsName(), ['assets']);
    assert.equal(instance.getStatic('assets'), instance.statics[0]);
});
