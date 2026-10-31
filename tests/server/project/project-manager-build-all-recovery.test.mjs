import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }, { ProjectManager }] = await loadServerModules([
    'project/Project.ts', 'project/ProjectManager.ts',
]);

test('buildAll starts builds and statics in both projects, then succeeds on retry after one failure', async () => {
    const manager = Object.create(ProjectManager.prototype);
    const calls = [];
    let releaseStatic;
    let fail = true;
    const first = Object.create(Project.prototype);
    first.builds = [
        { build: async () => { calls.push('first:build-one'); if (fail) throw new Error('first build failed'); } },
        { build: async () => { calls.push('first:build-two'); } },
    ];
    first.statics = [{ export: async () => { calls.push('first:static'); } }];
    const second = Object.create(Project.prototype);
    second.builds = [{ build: async () => { calls.push('second:build'); } }];
    second.statics = [{ export: () => {
        calls.push('second:static');
        return new Promise(resolve => { releaseStatic = resolve; });
    } }];
    manager.projects = { first, second };

    const rejected = manager.buildAll();
    assert.deepEqual(calls, [
        'first:build-one', 'first:build-two', 'first:static', 'second:build', 'second:static',
    ]);
    await assert.rejects(rejected, /first build failed/);
    releaseStatic();

    fail = false;
    const recovered = manager.buildAll();
    assert.deepEqual(calls.slice(5), [
        'first:build-one', 'first:build-two', 'first:static', 'second:build', 'second:static',
    ]);
    releaseStatic();
    await recovered;
});
