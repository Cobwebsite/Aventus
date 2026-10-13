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

test('single project build section normalizes punctuation separately for name and output', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-config-normalize-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    writeFileSync(path, JSON.stringify({ module: 'Demo', build: [], static: [] }));
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    });
    ProjectManager.getInstance = () => ({ getAllConfigFiles: () => [uri] });
    const prompts = [];
    const notifications = [];
    GenericServer.instance = { connection: {
        Select: async (items, options) => {
            prompts.push([options.title, items.map(item => item.label)]);
            return { label: 'Build' };
        },
        Input: async () => '  --My & cool Build!!  ',
        sendNotification: (...args) => notifications.push(args),
    } };

    await Commands.allCommandes['aventus.addConfigSection'].run();

    const config = JSON.parse(readFileSync(path, 'utf8'));
    assert.deepEqual(config.build, [{
        name: 'My_cool_Build', src: [], compile: [{ output: './dist/My-cool-Build.js' }],
    }]);
    assert.deepEqual(prompts, [['Section type', ['Build', 'Static']]]);
    assert.deepEqual(notifications, [['aventus/openfile', [uri]]]);
});
