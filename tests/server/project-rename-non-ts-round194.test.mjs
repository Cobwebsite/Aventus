import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { Build }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'project/Build.ts',
]);

test('non-TypeScript file moves leave project edits empty while a later TypeScript move still reaches each build', async () => {
    const calls = [];
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};
    for (const name of ['alpha', 'beta']) {
        const build = Object.create(Build.prototype);
        build.tsLanguageService = {
            onRenameFile: async (oldUri, newUri) => {
                calls.push({ name, oldUri, newUri });
                return { [`file:///workspace/${name}/consumer.lib.avt`]: [{
                    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
                    newText: newUri,
                }] };
            },
        };
        const project = Object.create(Project.prototype);
        project.builds = [build];
        project.scssFiles = {};
        build.project = project;
        build.scssFiles = {};
        manager.projects[name] = project;
    }

    for (const extension of ['.wcv.avt', '.wcs.avt', '.scss', '.html', '.json']) {
        const changes = [{
            oldUri: `file:///workspace/shared/before${extension}`,
            newUri: `file:///workspace/shared/after${extension}`,
        }];
        assert.deepEqual(await manager.onRename(changes), {}, extension);
        assert.deepEqual(calls, [], extension);
    }

    const changes = [
        { oldUri: 'file:///workspace/shared/before.wcs.avt', newUri: 'file:///workspace/shared/after.wcs.avt' },
        { oldUri: 'file:///workspace/shared/before.lib.avt', newUri: 'file:///workspace/shared/after.lib.avt' },
    ];
    const edits = await manager.onRename(changes);
    assert.deepEqual(calls, ['alpha', 'beta'].map(name => ({ name, ...changes[1] })));
    assert.deepEqual(Object.keys(edits), [
        'file:///workspace/alpha/consumer.lib.avt',
        'file:///workspace/beta/consumer.lib.avt',
    ]);
    assert.ok(Object.values(edits).every(entries => entries.length === 1 && entries[0].newText === changes[1].newUri));
});
