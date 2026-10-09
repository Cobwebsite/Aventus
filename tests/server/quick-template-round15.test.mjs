import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { TemplateScript }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'cmds/index.ts',
    'files/Template.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);
const QuickTemplate = Commands.allCommandes['aventus.template.quick'];
const QuickTemplateEdit = Commands.allCommandes['aventus.template.quick_edit'];

async function withQuickFixtures(run) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-quick-template-'));
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.getInstance;
    const previousCreate = TemplateScript.create;
    const events = [];
    const settings = { quickCreations: [] };
    SettingsManager.getInstance = () => ({ settings, setSettings: (...args) => events.push(['settings', ...args]) });
    GenericServer.instance = {
        _template: { workspaces: [root], readGlobal: async () => ({ templates: {}, nb: 0 }) },
        _localProject: { readProjects: async () => ({ templates: {}, nb: 0 }) },
        _localTemplate: { readTemplates: async () => ({ templates: {}, nb: 0 }) },
        connection: {
            Select: async () => null,
            SelectMultiple: async () => null,
            showErrorMessage: value => events.push(['error', value]),
        },
    };
    try {
        await run({ root, settings, events, server: GenericServer.instance });
    } finally {
        GenericServer.instance = previousServer;
        SettingsManager.getInstance = previousSettings;
        TemplateScript.create = previousCreate;
        rmSync(root, { recursive: true, force: true });
    }
}

function script(name, folderPath, allowQuick = true) {
    return Object.assign(Object.create(TemplateScript.prototype), {
        name, folderPath, allowQuick, description: `${name} description`,
    });
}

test('quick template edit saves selected nested eligible scripts by folder path', async () => {
    await withQuickFixtures(async ({ root, settings, events, server }) => {
        const first = script('First', join(root, 'first'));
        const second = script('Second', join(root, 'second'));
        const hidden = script('Hidden', join(root, 'hidden'), false);
        settings.quickCreations = [first.folderPath];
        server._template.readGlobal = async () => ({ templates: { Group: { First: first, Hidden: hidden } } });
        server._localProject.readProjects = async () => ({ templates: { Second: second } });
        server.connection.SelectMultiple = async (items, options) => {
            assert.equal(options.title, 'Select quick templates');
            assert.deepEqual(items.map(item => [item.label, item.picked]), [['First', true], ['Second', false]]);
            return [{ label: 'Second' }];
        };
        await QuickTemplateEdit.run();
        assert.deepEqual(events, [['settings', { quickCreations: [second.folderPath] }, true]]);
    });
});

test('quick template edit cancellation preserves settings, and no eligible script clears stale choices', async () => {
    await withQuickFixtures(async ({ root, settings, events, server }) => {
        const first = script('First', join(root, 'first'));
        settings.quickCreations = [first.folderPath];
        server._template.readGlobal = async () => ({ templates: { First: first } });
        await QuickTemplateEdit.run();
        assert.deepEqual(events, []);
        server._template.readGlobal = async () => ({ templates: { First: script('First', first.folderPath, false) } });
        await QuickTemplateEdit.run();
        assert.deepEqual(events, [
            ['settings', { quickCreations: [] }, true],
            ['error', 'No template/project allow quick creation'],
        ]);
    });
});

test('quick creation resolves a configured directory and initializes its script in the sole workspace', async () => {
    await withQuickFixtures(async ({ root, settings }) => {
        const folder = join(root, 'template');
        mkdirSync(folder);
        const config = join(folder, 'template.avt.ts');
        writeFileSync(config, 'fixture');
        settings.quickCreations = [folder];
        const calls = [];
        TemplateScript.create = async path => {
            calls.push(['create', path]);
            return { init: async (...args) => calls.push(['init', ...args]) };
        };
        await QuickTemplate.run();
        assert.deepEqual(calls, [['create', config], ['init', root, root]]);
    });
});

test('quick creation reports a missing configured script without parsing it', async () => {
    await withQuickFixtures(async ({ root, settings, events }) => {
        const missing = join(root, 'missing');
        settings.quickCreations = [missing];
        TemplateScript.create = () => assert.fail('missing script should not be parsed');
        await QuickTemplate.run();
        assert.equal(existsSync(missing), false);
        assert.deepEqual(events, [['error', `The file doesn't exist : ${missing}`]]);
    });
});
