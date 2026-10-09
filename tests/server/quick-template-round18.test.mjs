import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { TemplateScript }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'cmds/index.ts', 'files/Template.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);
const quick = Commands.allCommandes['aventus.template.quick'];
const edit = Commands.allCommandes['aventus.template.quick_edit'];

async function fixture(run) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-quick-round18-'));
    const prior = [GenericServer.instance, SettingsManager.getInstance, TemplateScript.create];
    const settings = { quickCreations: [] };
    const events = [];
    SettingsManager.getInstance = () => ({ settings, setSettings: (...args) => events.push(['settings', ...args]) });
    GenericServer.instance = {
        _template: { workspaces: [root], readGlobal: async () => ({ templates: {} }), getGeneralGlobal: async () => ({ templates: {} }) },
        _localProject: { readProjects: async () => ({ templates: {} }) },
        _localTemplate: { readTemplates: async () => ({ templates: {} }) },
        connection: {
            Select: async () => null,
            SelectMultiple: async () => null,
            showErrorMessage: message => events.push(['error', message]),
        },
    };
    try {
        await run({ root, settings, events, server: GenericServer.instance });
    } finally {
        [GenericServer.instance, SettingsManager.getInstance, TemplateScript.create] = prior;
        rmSync(root, { recursive: true, force: true });
    }
}

test('quick creation selects a workspace before initializing an explicit template script', async () => {
    await fixture(async ({ root, settings, server }) => {
        const other = join(root, 'other');
        const folder = join(root, 'template');
        mkdirSync(other);
        mkdirSync(folder);
        const config = join(folder, 'template.avt.ts');
        writeFileSync(config, 'fixture');
        settings.quickCreations = [config];
        server._template.workspaces = [root, other];
        const calls = [];
        server.connection.Select = async (items, options) => {
            assert.equal(options.title, 'Select workspace');
            assert.deepEqual(items.map(item => item.label), [root, other]);
            return items[1];
        };
        TemplateScript.create = async path => {
            calls.push(['create', path]);
            return { init: async (...args) => calls.push(['init', ...args]) };
        };
        await quick.run();
        assert.deepEqual(calls, [['create', config], ['init', other, other]]);
    });
});

test('quick creation stops before parsing when workspace selection is cancelled', async () => {
    await fixture(async ({ root, settings, server, events }) => {
        settings.quickCreations = [join(root, 'template')];
        server._template.workspaces = [root, join(root, 'other')];
        TemplateScript.create = () => assert.fail('cancelled workspace must not load a template');
        await quick.run();
        assert.deepEqual(events, []);
    });
});

test('quick template edit accepts an empty selection and persists an empty list', async () => {
    await fixture(async ({ root, settings, server, events }) => {
        const template = Object.assign(Object.create(TemplateScript.prototype), {
            name: 'Example', description: 'Example template', folderPath: join(root, 'example'), allowQuick: true,
        });
        settings.quickCreations = [template.folderPath];
        server._template.readGlobal = async () => ({ templates: { Example: template } });
        server.connection.SelectMultiple = async items => {
            assert.deepEqual(items.map(item => [item.label, item.picked]), [['Example', true]]);
            return [];
        };
        await edit.run();
        assert.deepEqual(events, [['settings', { quickCreations: [] }, true]]);
    });
});

test('quick creation selects an eligible nested template among configured choices', async () => {
    await fixture(async ({ root, settings, server }) => {
        const firstFolder = join(root, 'first');
        const secondFolder = join(root, 'second');
        mkdirSync(firstFolder);
        mkdirSync(secondFolder);
        const secondConfig = join(secondFolder, 'template.avt.ts');
        writeFileSync(secondConfig, 'fixture');
        const first = Object.assign(Object.create(TemplateScript.prototype), {
            name: 'First', description: 'First template', folderPath: firstFolder, allowQuick: true,
        });
        const second = Object.assign(Object.create(TemplateScript.prototype), {
            name: 'Second', description: 'Second template', folderPath: secondFolder, allowQuick: true,
        });
        settings.quickCreations = [firstFolder, secondFolder];
        server._template.getGeneralGlobal = async () => ({ templates: { Group: { First: first } } });
        server._localTemplate.readTemplates = async () => ({ templates: { Second: second } });
        server.connection.Select = async (items, options) => {
            assert.equal(options.title, 'Select quick template');
            assert.deepEqual(items.map(item => item.label), ['First', 'Second']);
            return items[1];
        };
        const calls = [];
        TemplateScript.create = async path => {
            calls.push(['create', path]);
            return { init: async (...args) => calls.push(['init', ...args]) };
        };
        await quick.run();
        assert.deepEqual(calls, [['create', secondConfig], ['init', root, root]]);
    });
});
