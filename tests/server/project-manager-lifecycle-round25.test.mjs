import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ProjectManager } = await loadServerModule('project/ProjectManager.ts');

test('project manager starts every build before waiting and propagates a failed project', async () => {
    const manager = Object.create(ProjectManager.prototype);
    const started = [];
    let releaseFirst;
    const first = new Promise(resolve => { releaseFirst = resolve; });
    manager.projects = {
        one: { buildAll: () => { started.push('one'); return first; } },
        two: { buildAll: async () => { started.push('two'); throw new Error('build failed'); } },
    };
    const pending = manager.buildAll();
    assert.deepEqual(started, ['one', 'two']);
    releaseFirst();
    await assert.rejects(pending, /build failed/);
});

test('project manager destroys every registered project without dropping the registry', () => {
    const manager = Object.create(ProjectManager.prototype);
    const destroyed = [];
    manager.projects = {
        one: { destroy: () => destroyed.push('one') },
        two: { destroy: () => destroyed.push('two') },
    };
    manager.destroyAll();
    assert.deepEqual(destroyed, ['one', 'two']);
    assert.deepEqual(Object.keys(manager.projects), ['one', 'two']);
});
