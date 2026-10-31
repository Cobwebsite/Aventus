import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ProjectManager }] = await loadServerModules(['project/ProjectManager.ts']);

test('rename resumes against a reloaded project after another project finishes', async () => {
    const manager = Object.create(ProjectManager.prototype);
    const changes = [{ oldUri: 'file:///workspace/old.lib.avt', newUri: 'file:///workspace/new.lib.avt' }];
    const consumer = 'file:///workspace/consumer.wc.avt';
    const before = { range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } }, newText: 'new' };
    const current = { range: { start: { line: 2, character: 0 }, end: { line: 2, character: 3 } }, newText: 'new' };
    let releaseFirst;
    const firstGate = new Promise(resolve => { releaseFirst = resolve; });
    const calls = [];
    manager.projects = {
        first: { onRename: async received => {
            assert.equal(received, changes);
            calls.push('first');
            await firstGate;
            return { [consumer]: [before] };
        } },
        second: { onRename: async () => {
            calls.push('old second');
            throw new Error('retired project was used');
        } },
    };

    const pending = manager.onRename(changes);
    assert.deepEqual(calls, ['first']);
    manager.projects.second = { onRename: async received => {
        assert.equal(received, changes);
        calls.push('new second');
        return { [consumer]: [current] };
    } };
    releaseFirst();

    assert.deepEqual(await pending, { [consumer]: [before, current] });
    assert.deepEqual(calls, ['first', 'new second']);
});
