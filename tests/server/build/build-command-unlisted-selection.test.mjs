import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { ProjectManager }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts',
]);

test('build commands ignore a selected target absent from their offered choices', async t => {
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    });

    const uri = 'file:///demo/aventus.conf.avt';
    const offered = { name: 'Demo@offered', uri };
    const calls = [];
    const hidden = {
        build: () => calls.push('build'),
        buildNpm: () => calls.push('npm'),
        buildStorybook: () => calls.push('storybook'),
        export: async () => calls.push('static'),
    };
    ProjectManager.getInstance = () => ({
        getAllBuilds: () => [offered],
        getAllBuildsWithNpm: () => [offered, { name: 'Other@offered', uri }],
        getAllBuildsWithStory: () => [offered],
        getAllStatics: () => [{ ...offered, index: 0 }],
        getProjectByUri: requested => requested === uri ? {
            getBuild: name => name === 'Demo@hidden' ? hidden : undefined,
            getStaticAt: () => hidden,
        } : undefined,
    });
    GenericServer.instance = { connection: { Select: async items => {
        assert.ok(items.some(item => item.label === offered.name));
        assert.ok(items.every(item => item.label !== 'Demo@hidden'));
        return { label: 'Demo@hidden', detail: uri };
    } } };

    for (const command of ['aventus.compile', 'aventus.npm.build', 'aventus.storybook.build', 'aventus.static']) {
        await Commands.allCommandes[command].run();
        assert.deepEqual(calls, []);
    }
});
