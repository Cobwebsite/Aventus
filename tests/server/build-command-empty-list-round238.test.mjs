import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { ProjectManager }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts',
]);

test('build commands present an empty selection and do no work when no target exists', async t => {
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    });

    const selections = [];
    let projectLookups = 0;
    ProjectManager.getInstance = () => ({
        getAllBuilds: () => [],
        getAllBuildsWithNpm: () => [],
        getAllBuildsWithStory: () => [],
        getAllStatics: () => [],
        getProjectByUri: () => { projectLookups++; throw new Error('unexpected project lookup'); },
    });
    GenericServer.instance = { connection: {
        Select: async (items, options) => {
            selections.push({ items, title: options.title });
            return undefined;
        },
    } };

    for (const command of [
        'aventus.compile', 'aventus.npm.build',
        'aventus.storybook.build', 'aventus.static',
    ]) {
        await Commands.allCommandes[command].run();
    }

    assert.deepEqual(selections, [
        { items: [], title: 'Project to compile' },
        { items: [], title: 'Package to build' },
        { items: [], title: 'Story to build' },
        { items: [], title: 'Static to export' },
    ]);
    assert.equal(projectLookups, 0);
});
