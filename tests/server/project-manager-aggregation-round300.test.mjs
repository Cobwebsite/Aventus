import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ProjectManager } = await loadServerModule('project/ProjectManager.ts');

test('rename combines edits per target URI in project order, including shared targets', async () => {
    const changes = [{ oldUri: 'file:///old.lib.avt', newUri: 'file:///new.lib.avt' }];
    const calls = [];
    const project = (name, edits) => ({
        onRename: async received => {
            assert.equal(received, changes);
            calls.push(name);
            await Promise.resolve();
            return edits;
        },
    });
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {
        first: project('first', {
            'file:///shared.lib.avt': [{ newText: 'first' }],
            'file:///first.lib.avt': [{ newText: 'only-first' }],
        }),
        second: project('second', {
            'file:///shared.lib.avt': [{ newText: 'second-a' }, { newText: 'second-b' }],
        }),
        third: project('third', {
            'file:///third.lib.avt': [{ newText: 'only-third' }],
            'file:///shared.lib.avt': [{ newText: 'third' }],
        }),
    };

    assert.deepEqual(await manager.onRename(changes), {
        'file:///shared.lib.avt': [
            { newText: 'first' }, { newText: 'second-a' },
            { newText: 'second-b' }, { newText: 'third' },
        ],
        'file:///first.lib.avt': [{ newText: 'only-first' }],
        'file:///third.lib.avt': [{ newText: 'only-third' }],
    });
    assert.deepEqual(calls, ['first', 'second', 'third']);
});

test('routing aggregates every matching build and drops a removed project immediately', () => {
    const manager = Object.create(ProjectManager.prototype);
    const shared = { name: 'shared' };
    const firstOnly = { name: 'first-only' };
    const secondOnly = { name: 'second-only' };
    const calls = [];
    manager.projects = {
        first: { getMatchingBuildsByUri: uri => {
            calls.push(['first', uri]);
            return [shared, firstOnly];
        } },
        second: { getMatchingBuildsByUri: uri => {
            calls.push(['second', uri]);
            return [shared, secondOnly];
        } },
    };

    const uri = 'file:///shared/source.lib.avt';
    assert.deepEqual(manager.getMatchingBuildsByUri(uri), [shared, firstOnly, shared, secondOnly]);
    delete manager.projects.first;
    assert.deepEqual(manager.getMatchingBuildsByUri(uri), [shared, secondOnly]);
    assert.deepEqual(calls, [
        ['first', uri], ['second', uri], ['second', uri],
    ]);
});
