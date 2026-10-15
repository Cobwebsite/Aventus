import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { ProjectManager }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts',
]);

test('build commands recover from a failed selection on the next invocation', async t => {
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    });

    const uri = 'file:///demo/aventus.conf.avt';
    const calls = [];
    const project = {
        getBuild: name => ({
            build: () => calls.push(['build', name]),
            buildNpm: () => calls.push(['npm', name]),
            buildStorybook: () => calls.push(['storybook', name]),
        }),
        getStatic: name => ({ export: async () => calls.push(['static', name]) }),
    };
    const build = { name: 'Demo@web', uri };
    const staticBuild = { name: 'Demo@assets', uri };
    ProjectManager.getInstance = () => ({
        getAllBuilds: () => [build],
        getAllBuildsWithNpm: () => [build, { name: 'Other@web', uri }],
        getAllBuildsWithStory: () => [build],
        getAllStatics: () => [staticBuild],
        getProjectByUri: requested => requested === uri ? project : undefined,
    });

    for (const [command, kind, name] of [
        ['aventus.compile', 'build', 'Demo@web'],
        ['aventus.npm.build', 'npm', 'Demo@web'],
        ['aventus.storybook.build', 'storybook', 'Demo@web'],
        ['aventus.static', 'static', 'Demo@assets'],
    ]) {
        let selects = 0;
        GenericServer.instance = { connection: { Select: async items => {
            selects++;
            if (selects === 1) throw new Error('selection unavailable');
            return items[0];
        } } };
        await assert.rejects(Commands.allCommandes[command].run(), /selection unavailable/);
        assert.deepEqual(calls.filter(call => call[0] === kind), [], `${kind} ran after a rejected selection`);
        await Commands.allCommandes[command].run();
        assert.equal(selects, 2);
        assert.deepEqual(calls.at(-1), [kind, name]);
    }
    assert.equal(calls.length, 4);
});
