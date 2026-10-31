import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { ProjectManager }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts',
]);

test('build, npm, Storybook and static commands await their selected jobs', async t => {
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    });

    const pending = new Map();
    const started = [];
    const job = kind => () => {
        started.push(kind);
        return new Promise(resolve => pending.set(kind, resolve));
    };
    const item = { name: 'Demo@web', uri: 'file:///demo/aventus.conf.avt' };
    ProjectManager.getInstance = () => ({
        getAllBuilds: () => [item],
        getAllBuildsWithNpm: () => [item],
        getAllBuildsWithStory: () => [item],
        getAllStatics: () => [{ ...item, index: 0 }],
        getProjectByUri: () => ({
            getBuild: () => ({
                build: job('build'),
                buildNpm: job('npm'),
                buildStorybook: job('storybook'),
            }),
            getStaticAt: () => ({ export: job('static') }),
        }),
    });
    GenericServer.instance = { connection: { Select: async items => items[0] } };

    for (const [command, kind] of [
        ['aventus.compile', 'build'],
        ['aventus.npm.build', 'npm'],
        ['aventus.storybook.build', 'storybook'],
        ['aventus.static', 'static'],
    ]) {
        let settled = false;
        const completion = Commands.allCommandes[command].run().then(() => { settled = true; });
        await new Promise(resolve => setImmediate(resolve));
        assert.ok(pending.has(kind), `${kind} should have started`);
        assert.equal(settled, false, `${kind} command should await its job`);
        pending.get(kind)();
        await completion;
        assert.equal(settled, true);
    }
    assert.deepEqual(started, ['build', 'npm', 'storybook', 'static']);
});
