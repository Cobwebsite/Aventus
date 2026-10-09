import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { ProjectManager }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts',
]);
const commands = Commands.allCommandes;

test('build, npm and Storybook commands keep identical build names tied to their configuration URI', async t => {
    const oldManager = ProjectManager.getInstance;
    const oldServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = oldManager;
        GenericServer.instance = oldServer;
    });
    const calls = [];
    const names = [];
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};
    for (const root of ['alpha', 'beta']) {
        const uri = `file:///${root}/aventus.conf.avt`;
        manager.projects[uri] = {
            getConfigFile: () => ({ uri }),
            getBuildsName: () => ['Shared@web'],
            getBuildsNameWithNpm: () => ['Shared@web'],
            getBuildsNameWithStory: () => ['Shared@web'],
            getBuild: name => {
                names.push([root, name]);
                return {
                    build: () => calls.push([root, 'build']),
                    buildNpm: () => calls.push([root, 'npm']),
                    buildStorybook: () => calls.push([root, 'story']),
                };
            },
        };
    }
    ProjectManager.getInstance = () => manager;
    const selections = [];
    GenericServer.instance = { connection: { Select: async (items, options) => {
        selections.push([items, options.title]);
        return items.find(item => item.detail === 'file:///beta/aventus.conf.avt');
    } } };

    await commands['aventus.compile'].run();
    await commands['aventus.npm.build'].run();
    await commands['aventus.storybook.build'].run();

    assert.deepEqual(calls, [['beta', 'build'], ['beta', 'npm'], ['beta', 'story']]);
    assert.deepEqual(names, [['beta', 'Shared@web'], ['beta', 'Shared@web'], ['beta', 'Shared@web']]);
    assert.deepEqual(selections.map(([, title]) => title),
        ['Project to compile', 'Package to build', 'Story to build']);
    for (const [items] of selections) {
        assert.deepEqual(items, [
            { label: 'Shared@web', detail: 'file:///alpha/aventus.conf.avt' },
            { label: 'Shared@web', detail: 'file:///beta/aventus.conf.avt' },
        ]);
    }
});

test('static export awaits a failed destination and a later selection can still export another project', async t => {
    const oldManager = ProjectManager.getInstance;
    const oldServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = oldManager;
        GenericServer.instance = oldServer;
    });
    const calls = [];
    let selected = 'file:///alpha/aventus.conf.avt';
    const manager = {
        getAllStatics: () => ['alpha', 'beta'].map(root => ({
            name: 'Shared@assets', uri: `file:///${root}/aventus.conf.avt`,
        })),
        getProjectByUri: uri => ({
            getStatic: name => ({ export: async () => {
                calls.push([uri, name]);
                if (uri.includes('/alpha/')) throw new Error('destination unavailable');
            } }),
        }),
    };
    ProjectManager.getInstance = () => manager;
    GenericServer.instance = { connection: { Select: async items =>
        items.find(item => item.detail === selected) } };

    await assert.rejects(commands['aventus.static'].run(), /destination unavailable/);
    selected = 'file:///beta/aventus.conf.avt';
    await commands['aventus.static'].run();
    assert.deepEqual(calls, [
        ['file:///alpha/aventus.conf.avt', 'Shared@assets'],
        ['file:///beta/aventus.conf.avt', 'Shared@assets'],
    ]);
});
