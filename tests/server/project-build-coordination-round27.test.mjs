import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const [{ Project }, { Mutex }] = await Promise.all([
    loadServerModule('project/Project.ts'), loadServerModule('Mutex.ts'),
]);

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
    return { promise, resolve, reject };
}

test('configuration saves serialize and release the lock after an invalid configuration', async () => {
    const project = Object.create(Project.prototype);
    const firstRead = deferred();
    const events = [];
    project.onConfigSaveMutex = new Mutex();
    project.config = null;
    project.builds = [];
    project.statics = [];
    let calls = 0;
    project.loadConfig = async () => {
        calls++;
        events.push(`load ${calls}`);
        if (calls === 1) await firstRead.promise;
    };

    const firstSave = project.onConfigSave();
    const secondSave = project.onConfigSave();
    await Promise.resolve();
    assert.deepEqual(events, ['load 1']);
    firstRead.resolve();
    await Promise.all([firstSave, secondSave]);
    assert.deepEqual(events, ['load 1', 'load 2']);
    await project.onConfigSave();
    assert.deepEqual(events, ['load 1', 'load 2', 'load 3']);
});

test('project propagates a static export failure after starting every build', async () => {
    const project = Object.create(Project.prototype);
    const events = [];
    project.builds = [
        { build: async () => { events.push('first'); } },
        { build: async () => { events.push('second'); } },
    ];
    project.statics = [{ export: async () => { events.push('static'); throw new Error('static output unavailable'); } }];

    await assert.rejects(project.buildAll(), /static output unavailable/);
    assert.deepEqual(events, ['first', 'second', 'static']);
});
