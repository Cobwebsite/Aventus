import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [commandsModule, projectModule, serverModule] =
    await loadServerModules([
        'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts',
    ]);
const commands = commandsModule.Commands.allCommandes;
const { ProjectManager } = projectModule;
const { GenericServer } = serverModule;

function arrange({ selection, builds = [], statics = [], npm = [], stories = [] }) {
    const calls = [];
    const selections = [];
    const manager = {
        getAllBuilds: () => builds,
        getAllStatics: () => statics,
        getAllBuildsWithNpm: () => npm,
        getAllBuildsWithStory: () => stories,
        getProjectByUri: uri => ({
            getBuild: name => ({
                build: () => calls.push(['build', uri, name]),
                buildNpm: () => calls.push(['npm', uri, name]),
                buildStorybook: () => calls.push(['storybook', uri, name]),
            }),
            getStatic: name => ({ export: () => calls.push(['static', uri, name]) }),
        }),
    };
    const previousGetInstance = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    ProjectManager.getInstance = () => manager;
    GenericServer.instance = {
        logLevel: 4,
        connection: { Select: async (items, options) => {
            selections.push({ items, options });
            return selection;
        } },
    };
    return { calls, selections, restore() {
        ProjectManager.getInstance = previousGetInstance;
        GenericServer.instance = previousServer;
    } };
}

test('build command offers project names and dispatches the selected build', async () => {
    const state = arrange({
        builds: [{ name: 'Demo@dev', uri: 'file:///demo/aventus.conf.avt' }, { name: 'Lib', uri: 'file:///lib/aventus.conf.avt' }],
        selection: { label: 'Lib', detail: 'file:///lib/aventus.conf.avt' },
    });
    try {
        await commands['aventus.compile'].run();
        assert.deepEqual(state.selections, [{
            items: [
                { label: 'Demo@dev', detail: 'file:///demo/aventus.conf.avt' },
                { label: 'Lib', detail: 'file:///lib/aventus.conf.avt' },
            ],
            options: { title: 'Project to compile' },
        }]);
        assert.deepEqual(state.calls, [['build', 'file:///lib/aventus.conf.avt', 'Lib']]);
    } finally { state.restore(); }
});

test('static and Storybook commands dispatch selection and respect cancellation', async () => {
    const target = { name: 'Demo@assets', uri: 'file:///demo/aventus.conf.avt' };
    const state = arrange({ statics: [target], stories: [target], selection: { label: target.name, detail: target.uri } });
    try {
        await commands['aventus.static'].run();
        await commands['aventus.storybook.build'].run();
        assert.deepEqual(state.calls, [
            ['static', target.uri, target.name],
            ['storybook', target.uri, target.name],
        ]);
        assert.deepEqual(state.selections.map(item => item.options.title), ['Static to export', 'Story to build']);
    } finally { state.restore(); }

    const canceled = arrange({ statics: [target], stories: [target], selection: null });
    try {
        await commands['aventus.static'].run();
        await commands['aventus.storybook.build'].run();
        assert.deepEqual(canceled.calls, []);
    } finally { canceled.restore(); }
});

test('npm command runs the single available build without prompting', async () => {
    const state = arrange({ npm: [{ name: 'Demo@npm', uri: 'file:///demo/aventus.conf.avt' }], selection: null });
    try {
        await commands['aventus.npm.build'].run();
        assert.deepEqual(state.selections, []);
        assert.deepEqual(state.calls, [['npm', 'file:///demo/aventus.conf.avt', 'Demo@npm']]);
    } finally { state.restore(); }
});

test('npm command prompts for multiple builds and skips a canceled selection', async () => {
    const npm = [{ name: 'A', uri: 'file:///a' }, { name: 'B', uri: 'file:///b' }];
    const state = arrange({ npm, selection: null });
    try {
        await commands['aventus.npm.build'].run();
        assert.deepEqual(state.selections, [{
            items: npm.map(item => ({ label: item.name, detail: item.uri })),
            options: { title: 'Package to build' },
        }]);
        assert.deepEqual(state.calls, []);
    } finally { state.restore(); }
});
