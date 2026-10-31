import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ProjectManager } = await loadServerModule('project/ProjectManager.ts');

test('a project discovered during a global build joins only the next invocation', async () => {
    const manager = Object.create(ProjectManager.prototype);
    const calls = [];
    let finishFirst;
    const firstBuild = new Promise(resolve => { finishFirst = resolve; });
    const first = {
        buildAll: () => {
            calls.push('first');
            return calls.filter(name => name === 'first').length === 1 ? firstBuild : Promise.resolve();
        },
    };
    const newcomer = { buildAll: async () => { calls.push('newcomer'); } };
    manager.projects = { 'file:///first/aventus.conf.avt': first };

    const inFlight = manager.buildAll();
    assert.deepEqual(calls, ['first']);

    manager.projects['file:///newcomer/aventus.conf.avt'] = newcomer;
    assert.deepEqual(calls, ['first']);
    finishFirst();
    await inFlight;
    assert.deepEqual(calls, ['first']);

    await manager.buildAll();
    assert.deepEqual(calls, ['first', 'first', 'newcomer']);
});
