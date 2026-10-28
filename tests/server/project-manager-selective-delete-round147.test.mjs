import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ProjectManager } = await loadServerModule('project/ProjectManager.ts');

test('deleting one configuration removes only its project from routing and listings', async () => {
    const manager = Object.create(ProjectManager.prototype);
    const destroyed = [];
    const firstUri = 'file:///workspace/first/aventus.conf.avt';
    const secondUri = 'file:///workspace/second/aventus.conf.avt';
    const makeProject = (name, uri) => ({
        destroy: () => destroyed.push(name),
        getConfigFile: () => ({ uri }),
        getBuildsName: () => [`${name}@web`],
        getBuildsNameWithStory: () => [`${name}@web`],
        getBuildsNameWithNpm: () => [`${name}@web`],
        getStaticsName: () => [`${name}-assets`],
        getMatchingBuildsByUri: sourceUri => sourceUri.startsWith(`file:///workspace/${name}/`) ? [name] : [],
    });
    manager.projects = {
        [firstUri]: makeProject('first', firstUri),
        [secondUri]: makeProject('second', secondUri),
    };

    await manager.onDeleteFile({ documentUser: { uri: firstUri } });

    assert.deepEqual(destroyed, ['first']);
    assert.equal(manager.getProjectByUri(firstUri), undefined);
    assert.ok(manager.getProjectByUri(secondUri));
    assert.deepEqual(manager.getAllConfigFiles(), [secondUri]);
    assert.deepEqual(manager.getAllBuilds(), [{ name: 'second@web', uri: secondUri }]);
    assert.deepEqual(manager.getAllBuildsWithStory(), [{ name: 'second@web', uri: secondUri }]);
    assert.deepEqual(manager.getAllBuildsWithNpm(), [{ name: 'second@web', uri: secondUri }]);
    assert.deepEqual(manager.getAllStatics(), [{ name: 'second-assets', uri: secondUri, index: 0 }]);
    assert.deepEqual(manager.getMatchingBuildsByUri('file:///workspace/first/source.lib.avt'), []);
    assert.deepEqual(manager.getMatchingBuildsByUri('file:///workspace/second/source.lib.avt'), ['second']);
});
