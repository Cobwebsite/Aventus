import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [commandsModule, projectModule, serverModule] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts',
]);
const AddConfigSection = commandsModule.Commands.allCommandes['aventus.addConfigSection'];
const { ProjectManager } = projectModule;
const { GenericServer } = serverModule;

test('add config section appends build and static entries to a selected configuration', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.config-command-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const configPath = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(configPath).href;
    writeFileSync(configPath, JSON.stringify({ module: 'Demo', build: [], static: [] }));
    const notifications = [];
    const prompts = [];
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    ProjectManager.getInstance = () => ({ getAllConfigFiles: () => [uri] });
    GenericServer.instance = {
        logLevel: 4,
        connection: {
            Select: async (items, options) => {
                prompts.push(options.title);
                return items.find(item => item.label === (prompts.length === 1 ? 'Build' : 'Static'));
            },
            Input: async () => prompts.length === 1 ? 'Web App' : 'Assets',
            sendNotification: (...args) => notifications.push(args),
        },
    };
    try {
        await AddConfigSection.run();
        await AddConfigSection.run(uri);
        const config = JSON.parse(readFileSync(configPath, 'utf8'));
        assert.deepEqual(config.build, [{ name: 'Web App', src: [], compile: { output: './dist/Web-App.js' } }]);
        assert.deepEqual(config.static, [{ name: 'Assets', input: '', output: '' }]);
        assert.deepEqual(prompts, ['Section type', 'Section type']);
        assert.equal(notifications.length, 2);
    } finally {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    }
});

test('add config section leaves the file untouched after canceled section selection', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.config-command-cancel-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const configPath = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(configPath).href;
    const content = '{"module":"Demo","build":[],"static":[]}';
    writeFileSync(configPath, content);
    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 4, connection: { Select: async () => null } };
    try {
        await AddConfigSection.run(uri);
        assert.equal(readFileSync(configPath, 'utf8'), content);
    } finally { GenericServer.instance = previousServer; }
});
