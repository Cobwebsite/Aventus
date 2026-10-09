import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ProjectManager } = await loadServerModule('project/ProjectManager.ts');

function fakeProject(uri, name) {
    return {
        getConfigFile: () => ({ uri }),
        getBuildsName: () => [name],
        getBuildsNameWithStory: () => [`${name}-story`],
        getBuildsNameWithNpm: () => [`${name}-npm`],
        getStaticsName: () => [`${name}-assets`],
        getMatchingBuildsByUri: target => target.includes(name) ? [name] : [],
        onRename: async () => ({ 'file:///shared': [{ newText: name }] }),
        buildAll: async () => name,
    };
}

function manager() {
    const instance = Object.create(ProjectManager.prototype);
    instance.projects = {
        'file:///alpha/aventus.conf.avt': fakeProject('file:///alpha/aventus.conf.avt', 'alpha'),
        'file:///beta/aventus.conf.avt': fakeProject('file:///beta/aventus.conf.avt', 'beta'),
    };
    return instance;
}

test('project manager routes by configuration and collects matching builds', () => {
    const instance = manager();
    assert.equal(instance.getProjectByUri('file:///alpha/aventus.conf.avt'), instance.projects['file:///alpha/aventus.conf.avt']);
    assert.equal(instance.getProjectByUri('file:///missing'), undefined);
    assert.deepEqual(instance.getMatchingBuildsByUri('file:///alpha/src/file.wcl.avt'), ['alpha']);
    assert.deepEqual(instance.getMatchingBuildsByUri('file:///outside'), []);
    assert.deepEqual(instance.getAllConfigFiles(), [
        'file:///alpha/aventus.conf.avt', 'file:///beta/aventus.conf.avt',
    ]);
});

test('project manager lists ordinary, Storybook and npm builds', () => {
    const instance = manager();
    assert.deepEqual(instance.getAllBuilds(), [
        { name: 'alpha', uri: 'file:///alpha/aventus.conf.avt' },
        { name: 'beta', uri: 'file:///beta/aventus.conf.avt' },
    ]);
    assert.deepEqual(instance.getAllBuildsWithStory().map(item => item.name), ['alpha-story', 'beta-story']);
    assert.deepEqual(instance.getAllBuildsWithNpm().map(item => item.name), ['alpha-npm', 'beta-npm']);
});

test('project manager combines rename edits and builds every project', async () => {
    const instance = manager();
    assert.deepEqual(await instance.onRename([{ oldUri: 'old', newUri: 'new' }]), {
        'file:///shared': [{ newText: 'alpha' }, { newText: 'beta' }],
    });
    const built = [];
    for (const [uri, project] of Object.entries(instance.projects)) {
        project.buildAll = async () => { built.push(uri); };
    }
    await instance.buildAll();
    assert.deepEqual(built.sort(), Object.keys(instance.projects).sort());
});
