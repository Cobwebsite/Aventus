import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { ProjectManager }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts',
]);

test('build commands ignore a selection whose project or target disappears and work after restoration', async t => {
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    });

    const uri = 'file:///demo/aventus.conf.avt';
    const calls = [];
    const target = {
        build: () => calls.push('build'),
        buildNpm: () => calls.push('npm'),
        buildStorybook: () => calls.push('storybook'),
        export: async () => calls.push('static'),
    };
    let projectPresent = true;
    let targetPresent = true;
    const item = { name: 'Demo@web', uri };
    ProjectManager.getInstance = () => ({
        getAllBuilds: () => [item],
        getAllBuildsWithNpm: () => [item, { name: 'Other@web', uri }],
        getAllBuildsWithStory: () => [item],
        getAllStatics: () => [{ ...item, index: 0 }],
        getProjectByUri: requested => requested === uri && projectPresent ? {
            getBuild: () => targetPresent ? target : undefined,
            getStaticAt: () => targetPresent ? target : undefined,
        } : undefined,
    });

    let releaseSelection;
    GenericServer.instance = { connection: { Select: items => new Promise(resolve => {
        releaseSelection = () => resolve(items[0]);
    }) } };

    for (const [command, kind] of [
        ['aventus.compile', 'build'],
        ['aventus.npm.build', 'npm'],
        ['aventus.storybook.build', 'storybook'],
        ['aventus.static', 'static'],
    ]) {
        for (const removed of ['project', 'target']) {
            projectPresent = true;
            targetPresent = true;
            releaseSelection = undefined;
            const pending = Commands.allCommandes[command].run();
            assert.equal(typeof releaseSelection, 'function', `${kind} should offer a selection`);
            if (removed === 'project') projectPresent = false;
            else targetPresent = false;
            releaseSelection();
            await pending;
            assert.deepEqual(calls, [], `${kind} should ignore the removed ${removed}`);
        }

        projectPresent = true;
        targetPresent = true;
        releaseSelection = undefined;
        const restored = Commands.allCommandes[command].run();
        assert.equal(typeof releaseSelection, 'function');
        releaseSelection();
        await restored;
        assert.deepEqual(calls, [kind]);
        calls.length = 0;
    }
});
