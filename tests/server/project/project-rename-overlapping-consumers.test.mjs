import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { Build }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'project/Build.ts',
]);

test('two projects with one shared consumer aggregate independent rename edits', async () => {
    const oldUri = 'file:///workspace/shared/old.lib.avt';
    const newUri = 'file:///workspace/shared/new.lib.avt';
    const consumer = 'file:///workspace/shared/consumer.lib.avt';
    const calls = [];
    const makeProject = (name, line) => {
        const build = Object.create(Build.prototype);
        build.tsLanguageService = {
            onRenameFile: async (before, after) => {
                calls.push([name, before, after]);
                return { [consumer]: [{
                    range: { start: { line, character: 7 }, end: { line, character: 20 } },
                    newText: `./${name}/new.lib.avt`,
                }] };
            },
        };
        const project = Object.create(Project.prototype);
        project.builds = [build];
        return project;
    };
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {
        'file:///workspace/alpha/aventus.conf.avt': makeProject('alpha', 0),
        'file:///workspace/beta/aventus.conf.avt': makeProject('beta', 1),
    };

    const edits = await manager.onRename([{ oldUri, newUri }]);
    assert.deepEqual(calls, [
        ['alpha', oldUri, newUri], ['beta', oldUri, newUri],
    ]);
    assert.deepEqual(Object.keys(edits), [consumer]);
    assert.deepEqual(edits[consumer].map(edit => [edit.range.start.line, edit.newText]), [
        [0, './alpha/new.lib.avt'], [1, './beta/new.lib.avt'],
    ]);
});
