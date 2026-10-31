import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { Project } = await loadServerModule('project/Project.ts');

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

test('synchronous static failure still dispatches later outputs and retry dispatches every output', async () => {
    const project = Object.create(Project.prototype);
    const pendingBuild = deferred();
    const calls = [];
    let fail = true;

    project.builds = [
        { build: () => { calls.push('first build'); return pendingBuild.promise; } },
        { build: async () => { calls.push('second build'); } },
    ];
    project.statics = [
        { export: () => {
            calls.push('first static');
            if (fail) throw new Error('static setup failed');
            return Promise.resolve();
        } },
        { export: async () => { calls.push('second static'); } },
    ];

    await assert.rejects(project.buildAll(), /static setup failed/);
    assert.deepEqual(calls, ['first build', 'second build', 'first static', 'second static']);

    pendingBuild.resolve();
    fail = false;
    await project.buildAll();
    assert.deepEqual(calls, [
        'first build', 'second build', 'first static', 'second static',
        'first build', 'second build', 'first static', 'second static',
    ]);
});
