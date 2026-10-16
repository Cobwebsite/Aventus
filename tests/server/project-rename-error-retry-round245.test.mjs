import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ProjectManager }] = await loadServerModules(['project/ProjectManager.ts']);

test('a failed project rename can be retried without leaking partial edits', async () => {
    const manager = Object.create(ProjectManager.prototype);
    const changes = [{ oldUri: 'file:///workspace/old.lib.avt', newUri: 'file:///workspace/new.lib.avt' }];
    const consumer = 'file:///workspace/consumer.wc.avt';
    const firstEdit = { range: { start: { line: 1, character: 0 }, end: { line: 1, character: 3 } }, newText: 'new' };
    const secondEdit = { range: { start: { line: 3, character: 0 }, end: { line: 3, character: 3 } }, newText: 'new' };
    const calls = [];
    let fail = true;
    manager.projects = {
        first: { onRename: async received => {
            assert.equal(received, changes);
            calls.push('first');
            return { [consumer]: [firstEdit] };
        } },
        second: { onRename: async received => {
            assert.equal(received, changes);
            calls.push('second');
            if (fail) throw new Error('rename unavailable');
            return { [consumer]: [secondEdit] };
        } },
    };

    await assert.rejects(manager.onRename(changes), /rename unavailable/);
    assert.deepEqual(calls, ['first', 'second']);

    fail = false;
    assert.deepEqual(await manager.onRename(changes), { [consumer]: [firstEdit, secondEdit] });
    assert.deepEqual(calls, ['first', 'second', 'first', 'second']);

    delete manager.projects.first;
    assert.deepEqual(await manager.onRename(changes), { [consumer]: [secondEdit] });
    assert.deepEqual(calls, ['first', 'second', 'first', 'second', 'second']);
});
