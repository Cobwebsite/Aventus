import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { ProjectManager }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts',
]);

const commands = Commands.allCommandes;

test('build commands wait for selected outputs and return their results', async t => {
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    });

    for (const entry of [
        { command: 'aventus.compile', list: 'getAllBuilds', method: 'build' },
        { command: 'aventus.npm.build', list: 'getAllBuildsWithNpm', method: 'buildNpm' },
        { command: 'aventus.storybook.build', list: 'getAllBuildsWithStory', method: 'buildStorybook' },
        { command: 'aventus.static', list: 'getAllStatics', method: 'export' },
    ]) {
        await t.test(entry.command, async () => {
            const selected = { name: 'Shared@output', uri: 'file:///workspace/aventus.conf.avt' };
            let resolveOutput;
            const pendingOutput = new Promise(resolve => { resolveOutput = resolve; });
            const calls = [];
            const output = { [entry.method]: async () => {
                calls.push('started');
                await pendingOutput;
                calls.push('completed');
                return 'compiled';
            } };
            ProjectManager.getInstance = () => ({
                [entry.list]: () => [entry.list === 'getAllStatics' ? { ...selected, index: 0 } : selected],
                getProjectByUri: uri => {
                    assert.equal(uri, selected.uri);
                    return {
                        getBuild: name => { assert.equal(name, selected.name); return output; },
                        getStaticAt: index => { assert.equal(index, 0); return output; },
                    };
                },
            });
            GenericServer.instance = { connection: { Select: async () => ({
                label: selected.name, detail: selected.uri, ...(entry.list === 'getAllStatics' ? { id: '0' } : {}),
            }) } };

            let commandSettled = false;
            const commandResult = commands[entry.command].run().then(result => {
                commandSettled = true;
                return result;
            });
            try {
                await new Promise(resolve => setImmediate(resolve));
                assert.deepEqual(calls, ['started']);
                assert.equal(commandSettled, false);
            } finally {
                resolveOutput();
            }
            assert.equal(await commandResult, 'compiled');
            assert.deepEqual(calls, ['started', 'completed']);
        });
    }
});

test('build commands propagate output failures', async t => {
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    });

    const failure = new Error('build failed');
    const output = {
        build: async () => { throw failure; },
        buildNpm: async () => { throw failure; },
        buildStorybook: async () => { throw failure; },
        export: async () => { throw failure; },
    };
    ProjectManager.getInstance = () => ({
        getAllBuilds: () => [{ name: 'output', uri: 'file:///project' }],
        getAllBuildsWithNpm: () => [{ name: 'output', uri: 'file:///project' }],
        getAllBuildsWithStory: () => [{ name: 'output', uri: 'file:///project' }],
        getAllStatics: () => [{ name: 'output', uri: 'file:///project', index: 0 }],
        getProjectByUri: () => ({ getBuild: () => output, getStaticAt: () => output }),
    });
    GenericServer.instance = { connection: { Select: async items => items[0] } };

    for (const command of ['aventus.compile', 'aventus.npm.build', 'aventus.storybook.build', 'aventus.static']) {
        await t.test(command, async () => {
            await assert.rejects(commands[command].run(), error => error === failure);
        });
    }
});

test('selection resolved after project or output removal safely skips the disappeared target', async t => {
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    });

    for (const command of ['aventus.compile', 'aventus.npm.build', 'aventus.storybook.build', 'aventus.static']) {
        for (const removed of ['project', 'output']) await t.test(`${command}: ${removed}`, async () => {
            const selected = { label: 'Old@output', detail: 'file:///old/aventus.conf.avt' };
            let available = true;
            const manager = {
                getAllBuilds: () => [{ name: selected.label, uri: selected.detail }],
                getAllBuildsWithNpm: () => [{ name: selected.label, uri: selected.detail }, { name: 'Other', uri: 'file:///other' }],
                getAllBuildsWithStory: () => [{ name: selected.label, uri: selected.detail }],
                getAllStatics: () => [{ name: selected.label, uri: selected.detail, index: 0 }],
                getProjectByUri: () => !available && removed === 'project' ? undefined : {
                    getBuild: () => available ? { build() {}, buildNpm() {}, buildStorybook() {} } : undefined,
                    getStaticAt: () => available ? { export() {} } : undefined,
                },
            };
            ProjectManager.getInstance = () => manager;
            GenericServer.instance = { connection: { Select: async () => {
                available = false;
                return command === 'aventus.static' ? { ...selected, id: '0' } : selected;
            } } };
            assert.equal(await commands[command].run(), undefined);
        });
    }
});
