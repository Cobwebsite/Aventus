import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Project } = await loadServerModule('project/Project.ts');

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}

test('project waits for every build and static export before buildAll completes', async () => {
    const project = Object.create(Project.prototype);
    const first = deferred();
    const second = deferred();
    const asset = deferred();
    const started = [];
    project.builds = [
        { build: () => { started.push('first'); return first.promise; } },
        { build: () => { started.push('second'); return second.promise; } },
    ];
    project.statics = [{ export: () => { started.push('asset'); return asset.promise; } }];

    let settled = false;
    const all = project.buildAll().then(() => { settled = true; });
    assert.deepEqual(started, ['first', 'second', 'asset']);
    first.resolve();
    second.resolve();
    await Promise.resolve();
    assert.equal(settled, false);
    asset.resolve();
    await all;
    assert.equal(settled, true);
});

test('project forwards a failed build while still starting all exports', async () => {
    const project = Object.create(Project.prototype);
    const failure = new Error('compile failed');
    const started = [];
    project.builds = [
        { build: async () => { started.push('failed build'); throw failure; } },
        { build: async () => { started.push('other build'); } },
    ];
    project.statics = [{ export: async () => { started.push('assets'); } }];
    await assert.rejects(project.buildAll(), error => error === failure);
    assert.deepEqual(started, ['failed build', 'other build', 'assets']);
});

test('project merges rename edits from overlapping builds by target URI in build order', async () => {
    const project = Object.create(Project.prototype);
    const changes = [{ oldUri: 'file:///old.wcl.avt', newUri: 'file:///new.wcl.avt' }];
    const calls = [];
    project.builds = [
        { onRename: async actual => {
            calls.push(actual);
            return {
                'file:///shared': [{ newText: 'one' }],
                'file:///only-first': [{ newText: 'first' }],
            };
        } },
        { onRename: async actual => {
            calls.push(actual);
            return { 'file:///shared': [{ newText: 'two' }] };
        } },
    ];
    assert.deepEqual(await project.onRename(changes), {
        'file:///shared': [{ newText: 'one' }, { newText: 'two' }],
        'file:///only-first': [{ newText: 'first' }],
    });
    assert.deepEqual(calls, [changes, changes]);
});
