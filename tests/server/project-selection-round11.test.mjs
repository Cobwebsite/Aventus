import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { Build }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts',
]);

test('project selects every overlapping build while excluding a neighboring source folder', () => {
    const project = Object.create(Project.prototype);
    const makeBuild = (name, regex) => {
        const build = Object.create(Build.prototype);
        build.buildConfig = { srcPathRegex: regex };
        build.name = name;
        return build;
    };
    const application = makeBuild('application', /^D:\/app\/src\//);
    const shared = makeBuild('shared', /^D:\/app\/src\/shared\//);
    project.builds = [application, shared];

    assert.deepEqual(project.getMatchingBuildsByUri('file:///D:/app/src/shared/widget.wcl.avt'),
        [application, shared]);
    assert.deepEqual(project.getMatchingBuildsByUri('file:///D:/app/src/other/widget.wcl.avt'),
        [application]);
    assert.deepEqual(project.getMatchingBuildsByUri('file:///D:/app/src-extra/widget.wcl.avt'), []);
});

test('project finds a component definition only in the build owning an exact output path', () => {
    const project = Object.create(Project.prototype);
    const requested = [];
    const first = { outputPathes: ['D:/out/first.package.avt'],
        getLocalWebComponentDefinition: name => { requested.push(['first', name]); return { source: 'first' }; } };
    const second = { outputPathes: ['D:/out/second.package.avt'],
        getLocalWebComponentDefinition: name => { requested.push(['second', name]); return { source: 'second' }; } };
    project.builds = [first, second];

    assert.deepEqual(project.getInternalWebComponentDefinition('D:/out/second.package.avt', 'x-button'),
        { source: 'second' });
    assert.deepEqual(requested, [['second', 'x-button']]);
    assert.equal(project.getInternalWebComponentDefinition('D:/out/second.package.avt.map', 'x-button'), undefined);
    assert.deepEqual(requested, [['second', 'x-button']]);
});

test('alias replacement honors a complete alias segment and normalizes trailing separators', () => {
    const project = Object.create(Project.prototype);
    project.configFile = { folderPath: 'D:\\app\\' };
    project.config = { aliases: { '@src': 'src\\' } };

    assert.equal(project.resolveAlias('@src/model', 'D:\\app\\src\\'), './model');
    assert.equal(project.resolveAlias('@src/model', 'D:\\app\\src\\ui\\'), '../model');
    assert.equal(project.resolveAlias('@src-extra/model', 'D:\\app\\src\\'), '@src-extra/model');
});
