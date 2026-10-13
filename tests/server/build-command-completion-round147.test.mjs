import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { ProjectManager }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts',
]);

test('build command completion differs from static export while selected jobs are pending', async t => {
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
        getAllStatics: () => [item],
        getProjectByUri: () => ({
            getBuild: () => ({
                build: job('build'),
                buildNpm: job('npm'),
                buildStorybook: job('storybook'),
            }),
            getStatic: () => ({ export: job('static') }),
        }),
    });
    GenericServer.instance = { connection: { Select: async items => items[0] } };

    for (const [command, kind] of [
        ['aventus.compile', 'build'],
        ['aventus.npm.build', 'npm'],
        ['aventus.storybook.build', 'storybook'],
    ]) {
        await Commands.allCommandes[command].run();
        assert.ok(pending.has(kind), `${kind} should have started`);
        pending.get(kind)();
    }

    let settled = false;
    const completion = Commands.allCommandes['aventus.static'].run().then(() => { settled = true; });
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(started, ['build', 'npm', 'storybook', 'static']);
    assert.equal(settled, false);
    pending.get('static')();
    await completion;
    assert.equal(settled, true);
});
