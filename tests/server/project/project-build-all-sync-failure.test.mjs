import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }] = await loadServerModules(['project/Project.ts']);

test('a synchronous build failure still dispatches later builds and statics, then retry runs all', async () => {
    const project = Object.create(Project.prototype);
    const calls = [];
    let fail = true;
    project.builds = [
        { build: () => {
            calls.push('first build');
            if (fail) throw new Error('build setup failed');
            return Promise.resolve();
        } },
        { build: async () => { calls.push('second build'); } },
    ];
    project.statics = [{ export: async () => { calls.push('static export'); } }];

    await assert.rejects(project.buildAll(), /build setup failed/);
    assert.deepEqual(calls, ['first build', 'second build', 'static export']);

    fail = false;
    await project.buildAll();
    assert.deepEqual(calls, [
        'first build', 'second build', 'static export',
        'first build', 'second build', 'static export',
    ]);
});
