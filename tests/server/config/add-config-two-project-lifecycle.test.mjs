import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { ProjectManager }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts',
]);

test('successive build and static additions preserve each selected project configuration', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-config-project-lifecycle-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const paths = [join(root, 'first.conf.avt'), join(root, 'second.conf.avt')];
    const uris = paths.map(path => pathToFileURL(path).href);
    const initial = [
        { module: 'First', build: [{ name: 'Existing', src: ['old'] }], static: [], custom: { key: 1 } },
        { module: 'Second', build: [], static: [{ name: 'Kept', input: 'in', output: 'out' }], custom: { key: 2 } },
    ];
    paths.forEach((path, index) => writeFileSync(path, JSON.stringify(initial[index])));
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    });
    ProjectManager.getInstance = () => ({ getAllConfigFiles: () => uris });
    const prompts = [];
    const notifications = [];
    let round = 0;
    GenericServer.instance = { connection: {
        Select: async (_items, options) => {
            prompts.push(options.title);
            if (options.title === 'Select a project to add section') return { label: uris[0] };
            return { label: round === 0 ? 'Build' : 'Static' };
        },
        Input: async () => round === 0 ? 'First build' : 'Second assets',
        sendNotification: (...args) => notifications.push(args),
    } };

    await Commands.allCommandes['aventus.addConfigSection'].run(uris[1]);
    assert.deepEqual(JSON.parse(readFileSync(paths[0], 'utf8')), initial[0]);
    assert.deepEqual(JSON.parse(readFileSync(paths[1], 'utf8')), {
        ...initial[1],
        build: [{ name: 'First_build', src: [], compile: [{ output: './dist/First-build.js' }] }],
    });
    round = 1;
    await Commands.allCommandes['aventus.addConfigSection'].run();

    assert.deepEqual(JSON.parse(readFileSync(paths[0], 'utf8')), {
        ...initial[0],
        static: [{ name: 'Second assets', input: '', output: '' }],
    });
    assert.deepEqual(JSON.parse(readFileSync(paths[1], 'utf8')), {
        ...initial[1],
        build: [{ name: 'First_build', src: [], compile: [{ output: './dist/First-build.js' }] }],
    });
    assert.deepEqual(prompts, ['Section type', 'Select a project to add section', 'Section type']);
    assert.deepEqual(notifications, [
        ['aventus/openfile', [uris[1]]], ['aventus/openfile', [uris[0]]],
    ]);
});
