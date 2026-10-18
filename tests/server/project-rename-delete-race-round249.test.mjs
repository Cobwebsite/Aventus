import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ProjectManager } = await loadServerModule('project/ProjectManager.ts');

test('deleting a later project during rename skips it and permits a retry', async () => {
    const manager = Object.create(ProjectManager.prototype);
    const changes = [{ oldUri: 'file:///work/old.lib.avt', newUri: 'file:///work/new.lib.avt' }];
    const consumer = 'file:///work/consumer.wc.avt';
    const edit = { range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } }, newText: 'new' };
    let releaseFirst;
    let wait = true;
    const firstGate = new Promise(resolve => { releaseFirst = resolve; });
    const calls = [];
    manager.projects = {
        first: { onRename: async received => {
            assert.equal(received, changes);
            calls.push('first');
            if (wait) await firstGate;
            return { [consumer]: [edit] };
        } },
        second: { destroy: () => calls.push('destroy second'), onRename: async () => {
            calls.push('second');
            return {};
        } },
    };

    const pending = manager.onRename(changes);
    assert.deepEqual(calls, ['first']);
    await manager.onDeleteFile({ documentUser: { uri: 'second' } });
    releaseFirst();

    assert.deepEqual(await pending, { [consumer]: [edit] });
    assert.deepEqual(calls, ['first', 'destroy second']);
    assert.equal(manager.getProjectByUri('second'), undefined);

    wait = false;
    assert.deepEqual(await manager.onRename(changes), { [consumer]: [edit] });
    assert.deepEqual(calls, ['first', 'destroy second', 'first']);
});

test('deleting a project already processing rename still returns its stale edits', async () => {
    const manager = Object.create(ProjectManager.prototype);
    const changes = [{ oldUri: 'file:///work/old.lib.avt', newUri: 'file:///work/new.lib.avt' }];
    const retiredConsumer = 'file:///work/retired.wc.avt';
    const liveConsumer = 'file:///work/live.wc.avt';
    const retiredEdit = { newText: 'retired' };
    const liveEdit = { newText: 'live' };
    let releaseFirst;
    const gate = new Promise(resolve => { releaseFirst = resolve; });
    const calls = [];
    manager.projects = {
        first: { destroy: () => calls.push('destroy first'), onRename: async () => {
            calls.push('first');
            await gate;
            return { [retiredConsumer]: [retiredEdit] };
        } },
        second: { onRename: async () => {
            calls.push('second');
            return { [liveConsumer]: [liveEdit] };
        } },
    };

    const pending = manager.onRename(changes);
    assert.deepEqual(calls, ['first']);
    await manager.onDeleteFile({ documentUser: { uri: 'first' } });
    releaseFirst();

    assert.deepEqual(await pending, {
        [retiredConsumer]: [retiredEdit],
        [liveConsumer]: [liveEdit],
    });
    assert.deepEqual(calls, ['first', 'destroy first', 'second']);
    assert.equal(manager.getProjectByUri('first'), undefined);
});
