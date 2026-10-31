import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts',
]);

test('rename failure in one project propagates and a retry aggregates both projects without stale edits', async () => {
    const manager = Object.create(ProjectManager.prototype);
    const first = Object.create(Project.prototype);
    const second = Object.create(Project.prototype);
    manager.projects = { first, second };
    const changes = [{ oldUri: 'file:///workspace/old.lib.avt', newUri: 'file:///workspace/new.lib.avt' }];
    const consumer = 'file:///workspace/consumer.lib.avt';
    const calls = [];
    let fail = true;
    first.builds = [{ onRename: async received => {
        assert.equal(received, changes);
        calls.push('first-a');
        return { [consumer]: [{ newText: 'first-a' }] };
    } }, { onRename: async received => {
        assert.equal(received, changes);
        calls.push('first-b');
        if (fail) throw new Error('rename service unavailable');
        return { [consumer]: [{ newText: 'first-b' }] };
    } }];
    second.builds = [{ onRename: async received => {
        assert.equal(received, changes);
        calls.push('second');
        return { [consumer]: [{ newText: 'second' }] };
    } }];

    await assert.rejects(manager.onRename(changes), /rename service unavailable/);
    assert.deepEqual(calls, ['first-a', 'first-b']);

    fail = false;
    const edits = await manager.onRename(changes);
    assert.deepEqual(calls, ['first-a', 'first-b', 'first-a', 'first-b', 'second']);
    assert.deepEqual(edits, { [consumer]: [
        { newText: 'first-a' }, { newText: 'first-b' }, { newText: 'second' },
    ] });
});
