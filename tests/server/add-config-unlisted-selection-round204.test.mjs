import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { ProjectManager }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts',
]);

test('add config section rejects a selected URI absent from discovered projects', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-config-unlisted-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const paths = ['first.conf.avt', 'second.conf.avt', 'unlisted.conf.avt'].map(name => join(root, name));
    const uris = paths.map(path => pathToFileURL(path).href);
    const original = '{"module":"Demo","build":[],"static":[]}';
    paths.forEach(path => writeFileSync(path, original));

    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    });
    ProjectManager.getInstance = () => ({ getAllConfigFiles: () => uris.slice(0, 2) });
    const prompts = [];
    const notifications = [];
    const errors = [];
    GenericServer.instance = { connection: {
        Select: async (items, options) => {
            prompts.push([options.title, items.map(item => item.label)]);
            return options.title === 'Select a project to add section'
                ? { label: uris[2] } : { label: 'Static' };
        },
        Input: async () => 'Outside selection',
        sendNotification: (...args) => notifications.push(args),
        showErrorMessage: message => errors.push(message),
    } };

    await Commands.allCommandes['aventus.addConfigSection'].run();

    assert.deepEqual(prompts, [['Select a project to add section', uris.slice(0, 2)]]);
    assert.deepEqual(paths.map(path => readFileSync(path, 'utf8')), [original, original, original]);
    assert.deepEqual(notifications, []);
    assert.deepEqual(errors, ['The selected Aventus configuration is no longer available.']);
});
