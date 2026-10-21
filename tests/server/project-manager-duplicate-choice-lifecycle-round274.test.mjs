import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { ProjectManager }] = await loadServerModules([
    'project/Project.ts', 'project/ProjectManager.ts',
]);

test('duplicate build choices are listed once per name and project URI', () => {
    const manager = Object.create(ProjectManager.prototype);
    const makeProject = (uri, builds) => {
        const project = Object.create(Project.prototype);
        project.configFile = { uri };
        project.builds = builds;
        project.statics = [];
        return project;
    };
    const firstUri = 'file:///workspace/first/aventus.conf.avt';
    const secondUri = 'file:///workspace/second/aventus.conf.avt';
    const build = () => ({ fullname: 'Shared@web', hasStories: true, hasNpmOutput: true });
    const first = makeProject(firstUri, [build(), build()]);
    const second = makeProject(secondUri, [build()]);
    manager.projects = { first, second };
    const choice = uri => ({ name: 'Shared@web', uri });

    assert.deepEqual(manager.getAllBuilds(), [choice(firstUri), choice(secondUri)]);
    assert.deepEqual(manager.getAllBuildsWithStory(), [choice(firstUri), choice(secondUri)]);
    assert.deepEqual(manager.getAllBuildsWithNpm(), [choice(firstUri), choice(secondUri)]);

    first.builds.shift();
    assert.deepEqual(manager.getAllBuildsWithStory(), [choice(firstUri), choice(secondUri)]);
    assert.deepEqual(manager.getAllBuildsWithNpm(), [choice(firstUri), choice(secondUri)]);

    first.builds.length = 0;
    assert.deepEqual(manager.getAllBuildsWithStory(), [choice(secondUri)]);
    assert.deepEqual(manager.getAllBuildsWithNpm(), [choice(secondUri)]);
});
