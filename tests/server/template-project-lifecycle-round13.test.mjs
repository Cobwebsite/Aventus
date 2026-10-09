import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

test('built-in project import honors a nested installation folder and replaces stale contents', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-project-replace-'));
    const source = join(root, 'extension', 'templates', 'projects', 'starter');
    const destination = join(root, 'installed');
    const target = join(destination, 'team', 'starter');
    mkdirSync(source, { recursive: true });
    mkdirSync(target, { recursive: true });
    const config = join(source, 'template.avt.ts');
    writeFileSync(config, 'fixture');
    writeFileSync(join(source, 'fresh.txt'), 'new project');
    writeFileSync(join(target, 'stale.txt'), 'old project');
    const oldServer = GenericServer.instance;
    const oldCreate = TemplateScript.create;
    const messages = [];
    let reloads = 0;
    GenericServer.instance = {
        _extensionPath: join(root, 'extension'), logLevel: 99,
        connection: {
            Select: async () => ({ label: 'Local' }),
            SelectMultiple: async items => {
                assert.deepEqual(items.map(item => [item.label, item.picked]), [['Starter', true]]);
                return items;
            },
            showInformationMessage: message => messages.push(message),
        },
    };
    TemplateScript.create = async path => path === config
        ? { name: 'Starter', installationFolder: 'team/starter', description: 'Built-in project' }
        : undefined;
    const manager = Object.create(TemplateManager.prototype);
    manager.projectPath = [destination];
    manager.reloadProjects = async () => { reloads++; };
    try {
        await manager.selectProjectToImport(true);
        assert.equal(existsSync(join(target, 'stale.txt')), false);
        assert.equal(readFileSync(join(target, 'fresh.txt'), 'utf8'), 'new project');
        assert.equal(reloads, 1);
        assert.deepEqual(messages, ['Projects installed']);
    } finally {
        GenericServer.instance = oldServer;
        TemplateScript.create = oldCreate;
        rmSync(root, { recursive: true, force: true });
    }
});

test('project uninstall removes only the selected script from nested categories', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-project-uninstall-'));
    const first = join(root, 'first');
    const second = join(root, 'second');
    mkdirSync(first);
    mkdirSync(second);
    const script = (name, folder) => {
        const config = join(folder, 'template.avt.ts');
        writeFileSync(config, name);
        return Object.assign(Object.create(TemplateScript.prototype), { name, config });
    };
    const oldServer = GenericServer.instance;
    const messages = [];
    let reloads = 0;
    GenericServer.instance = { connection: {
        SelectMultiple: async items => {
            assert.deepEqual(items.map(item => item.label), ['First', 'Second']);
            return [items[1]];
        },
        showInformationMessage: message => messages.push(message),
    } };
    const manager = Object.create(TemplateManager.prototype);
    manager.loadedProjects = { Group: { First: script('First', first), Second: script('Second', second) } };
    manager.reloadProjects = async () => { reloads++; };
    try {
        await manager.selectProjectToUninstall();
        assert.equal(existsSync(first), true);
        assert.equal(existsSync(second), false);
        assert.equal(reloads, 1);
        assert.deepEqual(messages, ['Projects deleted']);
    } finally {
        GenericServer.instance = oldServer;
        rmSync(root, { recursive: true, force: true });
    }
});
