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

test('add config section selects one of two real files and leaves the other untouched', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.config-select-round32-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const first = join(root, 'first.conf.avt');
    const second = join(root, 'second.conf.avt');
    const original = JSON.stringify({ module: 'Demo', build: [], static: [] });
    writeFileSync(first, original);
    writeFileSync(second, original);
    const uris = [first, second].map(path => pathToFileURL(path).href);
    const prompts = [];
    const notifications = [];
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    ProjectManager.getInstance = () => ({ getAllConfigFiles: () => uris });
    GenericServer.instance = { logLevel: 4, connection: {
        Select: async (items, options) => {
            prompts.push([options.title, items.map(item => item.label)]);
            return options.title === 'Section type' ? { label: 'Static' } : { label: uris[1] };
        },
        Input: async () => 'Images',
        sendNotification: (...args) => notifications.push(args),
    } };
    try {
        await AddConfigSection.run();
        assert.equal(readFileSync(first, 'utf8'), original);
        assert.deepEqual(JSON.parse(readFileSync(second, 'utf8')).static, [
            { name: 'Images', input: '', output: '' },
        ]);
        assert.deepEqual(prompts, [
            ['Select a project to add section', uris],
            ['Section type', ['Build', 'Static']],
        ]);
        assert.equal(notifications.length, 1);
    } finally {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    }
});

test('add config section preserves malformed JSON and does not notify an opened file', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.config-invalid-round32-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const file = join(root, 'invalid.conf.avt');
    const original = '{"build": [}';
    writeFileSync(file, original);
    const previousServer = GenericServer.instance;
    const previousError = console.error;
    const errors = [];
    const notifications = [];
    console.error = error => errors.push(error);
    GenericServer.instance = { logLevel: 4, connection: {
        Select: async () => ({ label: 'Build' }),
        Input: async () => 'Never written',
        sendNotification: (...args) => notifications.push(args),
    } };
    try {
        await AddConfigSection.run(pathToFileURL(file).href);
        assert.equal(readFileSync(file, 'utf8'), original);
        assert.equal(errors.length, 1);
        assert.ok(errors[0] instanceof SyntaxError);
        assert.deepEqual(notifications, []);
    } finally {
        GenericServer.instance = previousServer;
        console.error = previousError;
    }
});
