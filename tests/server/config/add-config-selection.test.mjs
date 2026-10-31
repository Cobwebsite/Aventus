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

test('static section selection among projects changes only the selected config', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-config-select-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const paths = ['first', 'second'].map(name => join(root, `${name}.conf.avt`));
    const uris = paths.map(path => pathToFileURL(path).href);
    const initial = JSON.stringify({ module: 'Demo', build: [], static: [] });
    for (const path of paths) writeFileSync(path, initial);
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    });
    ProjectManager.getInstance = () => ({ getAllConfigFiles: () => uris });
    const prompts = [];
    const notifications = [];
    GenericServer.instance = { connection: {
        Select: async (items, options) => {
            prompts.push([options.title, items.map(item => item.label)]);
            return { label: prompts.length === 1 ? uris[1] : 'Static' };
        },
        Input: async () => '  Assets & images  ',
        sendNotification: (...args) => notifications.push(args),
    } };

    await Commands.allCommandes['aventus.addConfigSection'].run();

    assert.equal(readFileSync(paths[0], 'utf8'), initial);
    assert.deepEqual(JSON.parse(readFileSync(paths[1], 'utf8')).static, [{
        name: '  Assets & images  ', input: '', output: '',
    }]);
    assert.deepEqual(prompts, [
        ['Select a project to add section', uris],
        ['Section type', ['Build', 'Static']],
    ]);
    assert.deepEqual(notifications, [['aventus/openfile', [uris[1]]]]);
});

test('cancelling project selection leaves every configuration untouched', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-config-cancel-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const paths = ['first', 'second'].map(name => join(root, `${name}.conf.avt`));
    const uris = paths.map(path => pathToFileURL(path).href);
    const initial = JSON.stringify({ module: 'Demo', build: [], static: [] });
    for (const path of paths) writeFileSync(path, initial);
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    });
    ProjectManager.getInstance = () => ({ getAllConfigFiles: () => uris });
    let inputCalled = false;
    const notifications = [];
    GenericServer.instance = { connection: {
        Select: async () => undefined,
        Input: async () => { inputCalled = true; return 'Ignored'; },
        sendNotification: (...args) => notifications.push(args),
    } };

    await Commands.allCommandes['aventus.addConfigSection'].run();

    assert.equal(inputCalled, false);
    assert.deepEqual(paths.map(path => readFileSync(path, 'utf8')), [initial, initial]);
    assert.deepEqual(notifications, []);
});
