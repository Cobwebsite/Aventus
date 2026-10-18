import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ProjectManager } = await loadServerModule('project/ProjectManager.ts');

test('deleting one project during buildAll excludes it from later builds without detaching the active build', async () => {
    const manager = Object.create(ProjectManager.prototype);
    const firstUri = 'file:///workspace/first/aventus.conf.avt';
    const secondUri = 'file:///workspace/second/aventus.conf.avt';
    const calls = [];
    let finishFirst;
    const firstBuild = new Promise(resolve => { finishFirst = resolve; });
    const first = {
        buildAll: () => { calls.push('first:build'); return firstBuild; },
        destroy: () => { calls.push('first:destroy'); },
        getConfigFile: () => ({ uri: firstUri }),
        getBuildsName: () => ['First@main'],
    };
    const second = {
        buildAll: async () => { calls.push('second:build'); },
        destroy: () => { calls.push('second:destroy'); },
        getConfigFile: () => ({ uri: secondUri }),
        getBuildsName: () => ['Second@main'],
    };
    manager.projects = { [firstUri]: first, [secondUri]: second };

    const activeBuild = manager.buildAll();
    assert.deepEqual(calls, ['first:build', 'second:build']);
    let settled = false;
    activeBuild.then(() => { settled = true; });

    await manager.onDeleteFile({ documentUser: { uri: firstUri } });
    assert.deepEqual(calls, ['first:build', 'second:build', 'first:destroy']);
    assert.equal(manager.getProjectByUri(firstUri), undefined);
    assert.equal(manager.getProjectByUri(secondUri), second);
    assert.deepEqual(manager.getAllBuilds(), [{ name: 'Second@main', uri: secondUri }]);
    await Promise.resolve();
    assert.equal(settled, false);

    await manager.buildAll();
    assert.deepEqual(calls, ['first:build', 'second:build', 'first:destroy', 'second:build']);
    assert.equal(settled, false);

    finishFirst();
    await activeBuild;
    assert.equal(settled, true);
    assert.deepEqual(calls, ['first:build', 'second:build', 'first:destroy', 'second:build']);
});
