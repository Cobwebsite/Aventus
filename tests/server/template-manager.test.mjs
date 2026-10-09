import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [templateModule, serverModule, scriptModule] = await loadServerModules([
    'files/TemplateManager.ts',
    'GenericServer.ts',
    'files/Template.ts',
]);
const { TemplateManager } = templateModule;
const { GenericServer } = serverModule;
const { TemplateScript } = scriptModule;

test('template manager exposes loaded template, project and global registries', () => {
    const manager = Object.create(TemplateManager.prototype);
    manager.loadedTemplates = { card: {} };
    manager.loadedTemplatesLength = 1;
    manager.loadedProjects = { app: {} };
    manager.loadedProjectsLength = 2;
    manager.loadedGlobal = { reset: {} };
    manager.loadedGlobalLength = 3;
    assert.equal(manager.getGeneralTemplates(), manager.loadedTemplates);
    assert.equal(manager.getGeneralTemplatesLength(), 1);
    assert.equal(manager.getGeneralProjects(), manager.loadedProjects);
    assert.equal(manager.getGeneralProjectsLength(), 2);
    assert.equal(manager.getGeneralGlobal(), manager.loadedGlobal);
    assert.equal(manager.getGeneralGlobalLength(), 3);
});

test('template manager finds a workspace and reports missing workspaces', () => {
    const manager = Object.create(TemplateManager.prototype);
    manager.workspaces = ['D:\\app', 'D:\\other'];
    assert.equal(manager.findWorkspace('D:\\app\\src'), 'D:\\app');
    const messages = [];
    const previous = GenericServer.instance;
    GenericServer.instance = { connection: { showErrorMessage: message => messages.push(message) }, logLevel: 4 };
    try {
        assert.equal(manager.findWorkspace('D:\\missing'), '');
        assert.equal(messages.length, 1);
    } finally {
        GenericServer.instance = previous;
    }
});

test('template workspace lookup currently accepts a sibling prefix and favors the first nested root', () => {
    const manager = Object.create(TemplateManager.prototype);
    manager.workspaces = ['D:\\app', 'D:\\app\\feature'];
    assert.equal(manager.findWorkspace('D:\\apple\\src'), 'D:\\app');
    assert.equal(manager.findWorkspace('D:\\app\\feature\\src'), 'D:\\app');
});

test('template manager discovers nested template scripts and counts successful loads', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-templates-'));
    const nested = join(root, 'group', 'child');
    mkdirSync(nested, { recursive: true });
    const valid = join(nested, 'template.avt.ts');
    const rejectedFolder = join(root, 'rejected');
    mkdirSync(rejectedFolder);
    const rejected = join(rejectedFolder, 'template.avt.ts');
    writeFileSync(valid, 'placeholder');
    writeFileSync(rejected, 'placeholder');
    const original = TemplateScript.create;
    TemplateScript.create = async path => path === valid ? { name: 'Group.Child' } : undefined;
    try {
        const manager = Object.create(TemplateManager.prototype);
        const result = await manager.readTemplates([root, join(root, 'absent')]);
        assert.deepEqual(result, { templates: { Group: { Child: { name: 'Group.Child' } } }, nb: 1 });
    } finally {
        TemplateScript.create = original;
        rmSync(root, { recursive: true, force: true });
    }
});

test('template manager includes workspace global templates when a workspace exists', async () => {
    const manager = Object.create(TemplateManager.prototype);
    manager.loadedGlobal = { shared: {} };
    manager.loadedGlobalLength = 1;
    const calls = [];
    manager.readTemplates = async (...args) => {
        calls.push(args);
        return { templates: args[1], nb: args[2] + 1 };
    };
    const previous = GenericServer.instance;
    try {
        GenericServer.instance = { workspaces: [] };
        assert.deepEqual(await manager.readGlobal(), { templates: manager.loadedGlobal, nb: 1 });
        assert.equal(calls.length, 0);
        GenericServer.instance = { workspaces: ['file:///D:/app'] };
        assert.deepEqual(await manager.readGlobal(), { templates: manager.loadedGlobal, nb: 2 });
        assert.equal(calls[0][1], manager.loadedGlobal);
        assert.equal(calls[0][2], 1);
        assert.match(calls[0][0][0].replaceAll('\\', '/'), /D:\/app\/\.aventus\/global$/);
    } finally {
        GenericServer.instance = previous;
    }
});

test('template query sorts choices, skips disallowed scripts and enters categories', async () => {
    const manager = Object.create(TemplateManager.prototype);
    manager.workspaces = ['D:\\app'];
    const makeScript = (allowed, description) => {
        const script = Object.create(TemplateScript.prototype);
        script.description = description;
        script.isAllowed = async () => allowed;
        return script;
    };
    const script = makeScript(true, 'Ready');
    const hidden = makeScript(false, 'Hidden');
    const choices = [];
    const previous = GenericServer.instance;
    GenericServer.instance = {
        connection: { Select: async items => {
            choices.push(items.map(item => item.label));
            return items.find(item => item.label === (choices.length === 1 ? 'Group' : 'Item'));
        } },
    };
    try {
        const result = await manager.query('D:\\app\\src', {
            ZHidden: hidden,
            Group: { Item: script },
        });
        assert.equal(result, script);
        assert.deepEqual(choices, [['Group'], ['Item']]);
    } finally {
        GenericServer.instance = previous;
    }
});
