import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { LocalProjectManager }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'files/LocalProject.ts', 'GenericServer.ts',
]);

test('global template import replaces an installation and refreshes its registry', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-global-import-'));
    const source = join(root, 'extension', 'templates', 'global', 'sample');
    const destination = join(root, 'installed');
    const installed = join(destination, 'nested', 'sample');
    mkdirSync(source, { recursive: true });
    mkdirSync(installed, { recursive: true });
    const config = join(source, 'template.avt.ts');
    writeFileSync(config, 'fixture');
    writeFileSync(join(source, 'new.txt'), 'new');
    writeFileSync(join(installed, 'old.txt'), 'old');
    const previousServer = GenericServer.instance;
    const previousCreate = TemplateScript.create;
    const messages = [];
    let reloads = 0;
    GenericServer.instance = {
        _extensionPath: join(root, 'extension'), logLevel: 99,
        connection: {
            Select: async () => ({ label: 'Local' }),
            SelectMultiple: async items => { assert.deepEqual(items.map(item => [item.label, item.picked]), [['Sample', true]]); return items; },
            showInformationMessage: message => messages.push(message),
        },
    };
    TemplateScript.create = async path => path === config ? { name: 'Sample', description: 'Global fixture', installationFolder: 'nested/sample' } : undefined;
    const manager = Object.create(TemplateManager.prototype);
    manager.globalPath = [destination];
    manager.reloadGlobal = async () => { reloads++; };
    try {
        await manager.selectGlobalToImport(true);
        assert.equal(existsSync(join(installed, 'old.txt')), false);
        assert.equal(readFileSync(join(installed, 'new.txt'), 'utf8'), 'new');
        assert.equal(reloads, 1);
        assert.deepEqual(messages, ['Global templates installed']);
    } finally {
        GenericServer.instance = previousServer;
        TemplateScript.create = previousCreate;
        rmSync(root, { recursive: true, force: true });
    }
});

test('global template uninstall visits nested categories and removes only selected script', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-global-uninstall-'));
    const first = join(root, 'first');
    const second = join(root, 'second');
    mkdirSync(first);
    mkdirSync(second);
    const makeScript = (name, folder) => {
        writeFileSync(join(folder, 'template.avt.ts'), name);
        const script = Object.create(TemplateScript.prototype);
        script.name = name;
        script.config = join(folder, 'template.avt.ts');
        return script;
    };
    const previous = GenericServer.instance;
    const messages = [];
    let reloads = 0;
    GenericServer.instance = { connection: {
        SelectMultiple: async items => { assert.deepEqual(items.map(item => item.label), ['First', 'Second']); return [items[1]]; },
        showInformationMessage: message => messages.push(message),
    } };
    const manager = Object.create(TemplateManager.prototype);
    manager.loadedGlobal = { Nested: { First: makeScript('First', first), Second: makeScript('Second', second) } };
    manager.reloadGlobal = async () => { reloads++; };
    try {
        await manager.selectGlobalToUninstall();
        assert.equal(existsSync(first), true);
        assert.equal(existsSync(second), false);
        assert.equal(reloads, 1);
        assert.deepEqual(messages, ['Global templates deleted']);
    } finally {
        GenericServer.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});

test('global project creation delegates Init choice to local project creation', async () => {
    const path = 'D:\\workspace\\app';
    const choice = { label: 'Init', detail: 'Create a project' };
    const manager = {
        readGlobal: async () => ({ templates: { Shared: {} } }),
        query: async (actualPath, entries, custom) => {
            assert.equal(actualPath, path);
            assert.deepEqual(entries, { Shared: {} });
            assert.deepEqual(custom, [choice]);
            return choice;
        },
    };
    const local = new LocalProjectManager(manager);
    let created = 0;
    local.createProject = async actualPath => { assert.equal(actualPath, path); created++; };
    const previous = GenericServer.instance;
    GenericServer.instance = { _localProject: local };
    try {
        await local.createGlobal(path);
        assert.equal(created, 1);
    } finally {
        GenericServer.instance = previous;
    }
});

test('homonymous global choices currently import the first source even when the second is selected', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-global-duplicate-'));
    const base = join(root, 'extension', 'templates', 'global');
    const first = join(base, 'first');
    const second = join(base, 'second');
    const destination = join(root, 'installed');
    mkdirSync(first, { recursive: true });
    mkdirSync(second, { recursive: true });
    mkdirSync(destination);
    const firstConfig = join(first, 'template.avt.ts');
    const secondConfig = join(second, 'template.avt.ts');
    writeFileSync(firstConfig, 'first');
    writeFileSync(secondConfig, 'second');
    writeFileSync(join(first, 'source.txt'), 'first');
    writeFileSync(join(second, 'source.txt'), 'second');
    const previousServer = GenericServer.instance;
    const previousCreate = TemplateScript.create;
    GenericServer.instance = {
        _extensionPath: join(root, 'extension'), logLevel: 99,
        connection: {
            Select: async () => ({ label: 'Local' }),
            SelectMultiple: async items => { assert.deepEqual(items.map(item => item.label), ['Shared', 'Shared']); return [items[1]]; },
            showInformationMessage() {},
        },
    };
    TemplateScript.create = async path => ({ name: 'Shared', installationFolder: path === firstConfig ? 'first-target' : 'second-target' });
    const manager = Object.create(TemplateManager.prototype);
    manager.globalPath = [destination];
    manager.reloadGlobal = async () => {};
    try {
        await manager.selectGlobalToImport(false);
        assert.equal(readFileSync(join(destination, 'first-target', 'source.txt'), 'utf8'), 'first');
        assert.equal(existsSync(join(destination, 'second-target')), false);
    } finally {
        GenericServer.instance = previousServer;
        TemplateScript.create = previousCreate;
        rmSync(root, { recursive: true, force: true });
    }
});
