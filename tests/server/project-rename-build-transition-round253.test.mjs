import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Project } = await loadServerModule('project/Project.ts');

test('project rename finishes the original build list after a build-list replacement and uses the new list on retry', async () => {
    const project = Object.create(Project.prototype);
    const changes = [{ oldUri: 'file:///workspace/old.lib.avt', newUri: 'file:///workspace/new.lib.avt' }];
    const consumer = 'file:///workspace/consumer.wc.avt';
    const edit = (line, newText) => ({
        range: { start: { line, character: 0 }, end: { line, character: 3 } }, newText,
    });
    const firstEdit = edit(0, 'first');
    const retiredEdit = edit(1, 'retired');
    const replacementEdit = edit(2, 'replacement');
    const calls = [];
    let releaseFirst;
    const firstGate = new Promise(resolve => { releaseFirst = resolve; });
    project.builds = [
        { onRename: async received => {
            assert.equal(received, changes);
            calls.push('first');
            await firstGate;
            return { [consumer]: [firstEdit] };
        } },
        { onRename: async received => {
            assert.equal(received, changes);
            calls.push('retired');
            return { [consumer]: [retiredEdit] };
        } },
    ];

    const pending = project.onRename(changes);
    assert.deepEqual(calls, ['first']);
    project.builds = [{ onRename: async received => {
        assert.equal(received, changes);
        calls.push('replacement');
        return { [consumer]: [replacementEdit] };
    } }];
    releaseFirst();

    assert.deepEqual(await pending, { [consumer]: [firstEdit, retiredEdit] });
    assert.deepEqual(calls, ['first', 'retired']);
    assert.deepEqual(await project.onRename(changes), { [consumer]: [replacementEdit] });
    assert.deepEqual(calls, ['first', 'retired', 'replacement']);
});
