import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { ProjectManager }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts',
]);

test('canceling project or section name leaves every configuration byte intact', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.config-cancel-round93-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const paths = [join(root, 'first.conf.avt'), join(root, 'second.conf.avt')];
    const original = '{"module":"Demo", "build":[], "static":[]}\n';
    for (const path of paths) writeFileSync(path, original);
    const uris = paths.map(path => pathToFileURL(path).href);
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    });
    ProjectManager.getInstance = () => ({ getAllConfigFiles: () => uris });

    for (const stage of ['project', 'build name', 'static name']) {
        await t.test(stage, async () => {
            const prompts = [];
            const notifications = [];
            GenericServer.instance = { logLevel: 4, connection: {
                Select: async (_items, options) => {
                    prompts.push(options.title);
                    if (options.title === 'Select a project to add section') {
                        return stage === 'project' ? undefined : { label: uris[1] };
                    }
                    return { label: stage === 'static name' ? 'Static' : 'Build' };
                },
                Input: async () => { prompts.push('name'); return stage === 'static name' ? null : ''; },
                sendNotification: (...args) => notifications.push(args),
            } };
            assert.equal(await Commands.allCommandes['aventus.addConfigSection'].run(), undefined);
            assert.deepEqual(prompts, stage === 'project'
                ? ['Select a project to add section']
                : ['Select a project to add section', 'Section type', 'name']);
            assert.deepEqual(paths.map(path => readFileSync(path, 'utf8')), [original, original]);
            assert.deepEqual(notifications, []);
        });
    }
});
