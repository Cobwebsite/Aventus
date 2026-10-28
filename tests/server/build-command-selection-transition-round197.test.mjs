import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { ProjectManager }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts',
]);

test('build commands resolve the current project after selection pauses across a project replacement', async t => {
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    });

    const uri = 'file:///demo/aventus.conf.avt';
    const calls = [];
    const project = version => ({
        getBuild: name => ({
            build: () => calls.push([version, name, 'build']),
            buildNpm: () => calls.push([version, name, 'npm']),
            buildStorybook: () => calls.push([version, name, 'storybook']),
        }),
        getStaticAt: index => ({ export: async () => calls.push([version, index, 'static']) }),
    });
    let current = project('old');
    const manager = {
        getAllBuilds: () => [{ name: 'Demo@web', uri }],
        getAllBuildsWithNpm: () => [{ name: 'Demo@web', uri }, { name: 'Other@web', uri }],
        getAllBuildsWithStory: () => [{ name: 'Demo@web', uri }],
        getAllStatics: () => [{ name: 'Demo@assets', uri, index: 0 }],
        getProjectByUri: requested => requested === uri ? current : undefined,
    };
    ProjectManager.getInstance = () => manager;

    let select;
    GenericServer.instance = { connection: { Select: (items) => new Promise(resolve => {
        select = () => resolve(items[0]);
    }) } };

    for (const [command, kind, name] of [
        ['aventus.compile', 'build', 'Demo@web'],
        ['aventus.npm.build', 'npm', 'Demo@web'],
        ['aventus.storybook.build', 'storybook', 'Demo@web'],
        ['aventus.static', 'static', 'Demo@assets'],
    ]) {
        current = project('old');
        select = undefined;
        const running = Commands.allCommandes[command].run();
        assert.equal(typeof select, 'function', `${kind} should offer a selection`);
        current = project('new');
        select();
        await running;
        assert.deepEqual(calls.at(-1), ['new', kind === 'static' ? 0 : name, kind]);
    }
    assert.equal(calls.length, 4);
});
