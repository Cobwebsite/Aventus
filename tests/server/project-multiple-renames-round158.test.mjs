import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { Build }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'project/Build.ts',
]);

test('a batch of TypeScript renames currently forwards only its first source to each build', async () => {
    const changes = [
        { oldUri: 'file:///shared/first.lib.avt', newUri: 'file:///shared/first-renamed.lib.avt' },
        { oldUri: 'file:///shared/second.data.avt', newUri: 'file:///shared/second-renamed.data.avt' },
    ];
    const calls = [];
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};
    for (const name of ['alpha', 'beta']) {
        const build = Object.create(Build.prototype);
        build.tsLanguageService = {
            onRenameFile: async (oldUri, newUri) => {
                calls.push([name, oldUri, newUri]);
                return { [`file:///shared/${name}-consumer.lib.avt`]: [{
                    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
                    newText: newUri,
                }] };
            },
        };
        const project = Object.create(Project.prototype);
        project.builds = [build];
        manager.projects[name] = project;
    }

    const edits = await manager.onRename(changes);
    assert.deepEqual(calls, [
        ['alpha', changes[0].oldUri, changes[0].newUri],
        ['beta', changes[0].oldUri, changes[0].newUri],
    ]);
    assert.deepEqual(Object.keys(edits), [
        'file:///shared/alpha-consumer.lib.avt',
        'file:///shared/beta-consumer.lib.avt',
    ]);
    assert.ok(Object.values(edits).every(entries => entries[0].newText === changes[0].newUri));
});
