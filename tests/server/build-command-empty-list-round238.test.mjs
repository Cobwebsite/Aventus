import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { ProjectManager }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts',
]);

test('build commands skip selection and do no work when no target exists', async t => {
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    });

    const selections = [];
    const warnings = [];
    let projectLookups = 0;
    ProjectManager.getInstance = () => ({
        getAllBuilds: () => [],
        getAllBuildsWithNpm: () => [],
        getAllBuildsWithStory: () => [],
        getAllStatics: () => [],
        getProjectByUri: () => { projectLookups++; throw new Error('unexpected project lookup'); },
    });
    GenericServer.instance = { connection: {
        showWarningMessage: message => warnings.push(message),
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

    assert.deepEqual(selections, []);
    assert.deepEqual(warnings, [
        'No project to compile was found.',
        'No package to build was found.',
        'No Storybook build was found.',
        'No static export was found.',
    ]);
    assert.equal(projectLookups, 0);
});
