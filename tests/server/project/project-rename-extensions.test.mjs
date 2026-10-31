import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { Build }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'project/Build.ts',
]);

function managerWithProjects(names, calls) {
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};
    for (const name of names) {
        const build = Object.create(Build.prototype);
        build.tsLanguageService = {
            onRenameFile: async (oldUri, newUri) => {
                calls.push([name, oldUri, newUri]);
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
    return manager;
}

for (const extension of ['.wc.avt', '.wcl.avt', '.data.avt', '.lib.avt', '.ram.avt']) {
    test(`a ${extension} rename reaches every project with independent consumer edits`, async () => {
        const calls = [];
        const manager = managerWithProjects(['alpha', 'beta'], calls);
        const oldUri = `file:///workspace/shared/old${extension}`;
        const newUri = `file:///workspace/shared/new${extension}`;
        const edits = await manager.onRename([{ oldUri, newUri }]);

        assert.deepEqual(calls, [
            ['alpha', oldUri, newUri],
            ['beta', oldUri, newUri],
        ]);
        assert.deepEqual(Object.keys(edits), [
            'file:///workspace/alpha/consumer.lib.avt',
            'file:///workspace/beta/consumer.lib.avt',
        ]);
        for (const entries of Object.values(edits)) {
            assert.equal(entries.length, 1);
            assert.equal(entries[0].newText, newUri);
        }
    });
}

test('an unrelated rename before a TypeScript file does not mask its edits', async () => {
    const calls = [];
    const manager = managerWithProjects(['alpha'], calls);
    const changes = [
        { oldUri: 'file:///workspace/shared/old.wcs.avt', newUri: 'file:///workspace/shared/new.wcs.avt' },
        { oldUri: 'file:///workspace/shared/old.lib.avt', newUri: 'file:///workspace/shared/new.lib.avt' },
    ];
    const edits = await manager.onRename(changes);
    assert.deepEqual(calls, [['alpha', changes[1].oldUri, changes[1].newUri]]);
    assert.equal(edits['file:///workspace/alpha/consumer.lib.avt'][0].newText, changes[1].newUri);
});
