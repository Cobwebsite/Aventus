import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ProjectManager } = await loadServerModule('project/ProjectManager.ts');

test('global build waits for a deleted project already running, then excludes it on retry', async () => {
    const manager = Object.create(ProjectManager.prototype);
    const retiredUri = 'file:///workspace/retired/aventus.conf.avt';
    const liveUri = 'file:///workspace/live/aventus.conf.avt';
    const calls = [];
    let releaseRetired;
    let retiredDone = false;
    manager.projects = {
        [retiredUri]: {
            buildAll: () => {
                calls.push('retired build');
                return new Promise(resolve => { releaseRetired = resolve; });
            },
            destroy: () => calls.push('retired destroy'),
        },
        [liveUri]: {
            buildAll: async () => { calls.push('live build'); },
            destroy: () => calls.push('live destroy'),
        },
    };

    const pending = manager.buildAll().then(() => { retiredDone = true; });
    assert.deepEqual(calls, ['retired build', 'live build']);
    await manager.onDeleteFile({ documentUser: { uri: retiredUri } });
    assert.deepEqual(calls, ['retired build', 'live build', 'retired destroy']);
    assert.equal(manager.getProjectByUri(retiredUri), undefined);
    await Promise.resolve();
    assert.equal(retiredDone, false);

    releaseRetired();
    await pending;
    assert.equal(retiredDone, true);
    await manager.buildAll();
    assert.deepEqual(calls, [
        'retired build', 'live build', 'retired destroy', 'live build',
    ]);
});

test('global build still propagates failure from a project deleted while running', async () => {
    const manager = Object.create(ProjectManager.prototype);
    const retiredUri = 'file:///workspace/retired/aventus.conf.avt';
    const liveUri = 'file:///workspace/live/aventus.conf.avt';
    const failure = new Error('retired build failed');
    let rejectRetired;
    let liveBuilds = 0;
    manager.projects = {
        [retiredUri]: {
            buildAll: () => new Promise((_, reject) => { rejectRetired = reject; }),
            destroy: () => {},
        },
        [liveUri]: { buildAll: async () => { liveBuilds++; } },
    };

    const pending = manager.buildAll();
    await manager.onDeleteFile({ documentUser: { uri: retiredUri } });
    rejectRetired(failure);
    await assert.rejects(pending, error => error === failure);
    assert.equal(liveBuilds, 1);
    await manager.buildAll();
    assert.equal(liveBuilds, 2);
});
