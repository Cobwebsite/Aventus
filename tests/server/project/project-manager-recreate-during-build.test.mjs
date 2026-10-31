import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ProjectManager } = await loadServerModule('project/ProjectManager.ts');

test('a replacement project with the same URI builds independently of the deleted project still building', async () => {
    const manager = Object.create(ProjectManager.prototype);
    const uri = 'file:///workspace/app/aventus.conf.avt';
    const sourceUri = 'file:///workspace/app/component.avt';
    const calls = [];
    let finishOldBuild;
    const oldBuild = new Promise(resolve => { finishOldBuild = resolve; });
    const oldMatch = { name: 'old' };
    const newMatch = { name: 'new' };
    const oldProject = {
        buildAll: () => { calls.push('old:build'); return oldBuild; },
        destroy: () => { calls.push('old:destroy'); },
        getConfigFile: () => ({ uri }),
        getBuildsName: () => ['Old@main'],
        getMatchingBuildsByUri: () => [oldMatch],
    };
    const newProject = {
        buildAll: async () => { calls.push('new:build'); },
        destroy: () => { calls.push('new:destroy'); },
        getConfigFile: () => ({ uri }),
        getBuildsName: () => ['New@main'],
        getMatchingBuildsByUri: () => [newMatch],
    };
    manager.projects = { [uri]: oldProject };

    const firstBuild = manager.buildAll();
    assert.deepEqual(calls, ['old:build']);
    await manager.onDeleteFile({ documentUser: { uri } });
    manager.projects[uri] = newProject;

    assert.equal(manager.getProjectByUri(uri), newProject);
    assert.deepEqual(manager.getAllBuilds(), [{ name: 'New@main', uri }]);
    assert.deepEqual(manager.getMatchingBuildsByUri(sourceUri), [newMatch]);
    await manager.buildAll();
    assert.deepEqual(calls, ['old:build', 'old:destroy', 'new:build']);

    finishOldBuild();
    await firstBuild;
    assert.equal(manager.getProjectByUri(uri), newProject);
    assert.deepEqual(manager.getMatchingBuildsByUri(sourceUri), [newMatch]);
    assert.deepEqual(calls, ['old:build', 'old:destroy', 'new:build']);
});
