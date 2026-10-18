import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ProjectManager } = await loadServerModule('project/ProjectManager.ts');

test('a synchronous project build failure stops dispatch to later projects and a retry includes all projects', async () => {
    const manager = Object.create(ProjectManager.prototype);
    const calls = [];
    let fail = true;
    manager.projects = {
        first: {
            buildAll: () => {
                calls.push('first');
                if (fail) throw new Error('build setup failed');
                return Promise.resolve();
            },
        },
        second: { buildAll: async () => { calls.push('second'); } },
    };

    await assert.rejects(manager.buildAll(), /build setup failed/);
    assert.deepEqual(calls, ['first']);

    fail = false;
    await manager.buildAll();
    assert.deepEqual(calls, ['first', 'first', 'second']);
});
