import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ LocalTemplateManager }, { LocalProjectManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/LocalTemplate.ts', 'files/LocalProject.ts', 'files/Template.ts', 'GenericServer.ts',
]);

function withWorkspace(uri, action) {
    const previous = GenericServer.instance;
    GenericServer.instance = { workspaces: uri ? [uri] : [] };
    try { return action(); } finally { GenericServer.instance = previous; }
}

test('local template and project readers use the general registry without a workspace', () => {
    const manager = {
        getGeneralTemplates: () => ({ BuiltIn: 'template' }),
        getGeneralTemplatesLength: () => 1,
        getGeneralProjects: () => ({ BuiltIn: 'project' }),
        getGeneralProjectsLength: () => 2,
        readTemplates: () => { throw Error('unexpected local lookup'); },
    };
    withWorkspace(null, () => {
        assert.deepEqual(new LocalTemplateManager(manager).readTemplates(), { templates: { BuiltIn: 'template' }, nb: 1 });
        assert.deepEqual(new LocalProjectManager(manager).readProjects(), { templates: { BuiltIn: 'project' }, nb: 2 });
    });
});

test('local template and project readers pass workspace folders and built-in registries to discovery', () => {
    const calls = [];
    const generalTemplates = { BuiltIn: 'template' };
    const generalProjects = { BuiltIn: 'project' };
    const manager = {
        getGeneralTemplates: () => generalTemplates,
        getGeneralTemplatesLength: () => 1,
        getGeneralProjects: () => generalProjects,
        getGeneralProjectsLength: () => 2,
        readTemplates: (...args) => { calls.push(args); return { templates: args[1], nb: args[2] }; },
    };
    withWorkspace('file:///D:/workspace', () => {
        new LocalTemplateManager(manager).readTemplates();
        new LocalProjectManager(manager).readProjects();
    });
    assert.match(calls[0][0][0].replaceAll('\\', '/'), /D:\/workspace\/\.aventus\/templates$/);
    assert.equal(calls[0][1], generalTemplates);
    assert.equal(calls[0][2], 1);
    assert.match(calls[1][0][0].replaceAll('\\', '/'), /D:\/workspace\/\.aventus\/projects$/);
    assert.equal(calls[1][1], generalProjects);
    assert.equal(calls[1][2], 2);
});

test('local template creation gives workspace-global entries priority over local entries', async () => {
    const calls = [];
    const chosen = { init: async (...args) => calls.push(['init', ...args]) };
    const manager = {
        readGlobal: async () => ({ templates: { Same: 'global', Global: 'global' } }),
        getGeneralTemplates: () => ({}), getGeneralTemplatesLength: () => 0,
        query: async (path, entries) => { calls.push(['query', path, entries]); return chosen; },
        findWorkspace: () => 'D:\\workspace',
    };
    const local = new LocalTemplateManager(manager);
    local.readTemplates = () => ({ templates: { Same: 'local', Local: 'local' } });
    await local.createTemplate('D:\\workspace\\src');
    assert.deepEqual(calls, [
        ['query', 'D:\\workspace\\src', { Same: 'local', Global: 'global', Local: 'local' }],
        ['init', 'D:\\workspace\\src', 'D:\\workspace'],
    ]);
});

test('local project creation invokes the chosen project and leaves cancellation untouched', async () => {
    const calls = [];
    let selected = { init: async (...args) => calls.push(args) };
    const manager = {
        query: async () => selected,
        findWorkspace: () => 'D:\\workspace',
    };
    const local = new LocalProjectManager(manager);
    local.readProjects = () => ({ templates: { Starter: selected } });
    await local.createProject('D:\\workspace\\project');
    selected = null;
    await local.createProject('D:\\workspace\\cancelled');
    assert.deepEqual(calls, [['D:\\workspace\\project', 'D:\\workspace']]);
});

test('global creation initializes a selected script and returns on cancelled selection', async () => {
    const calls = [];
    const script = Object.create(TemplateScript.prototype);
    script.init = async (...args) => calls.push(args);
    let selected = script;
    const manager = {
        readGlobal: async () => ({ templates: { Starter: script } }),
        query: async (_path, _templates, quick) => { assert.equal(quick[0].label, 'Init'); return selected; },
        findWorkspace: () => 'D:\\workspace',
    };
    const local = new LocalProjectManager(manager);
    await local.createGlobal('D:\\workspace');
    selected = null;
    await local.createGlobal('D:\\workspace');
    assert.deepEqual(calls, [['D:\\workspace', 'D:\\workspace']]);
});
