import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { TemplateScript }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'cmds/index.ts', 'files/Template.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

test('quick creation ignores stale configured entries and runs the selected live template', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-quick-stale-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const prior = [GenericServer.instance, SettingsManager.getInstance, TemplateScript.create];
    t.after(() => {
        [GenericServer.instance, SettingsManager.getInstance, TemplateScript.create] = prior;
    });
    const liveFolder = join(root, 'live');
    mkdirSync(liveFolder);
    const config = join(liveFolder, 'template.avt.ts');
    writeFileSync(config, 'fixture');
    const stale = join(root, 'removed');
    const selected = [];
    const errors = [];
    SettingsManager.getInstance = () => ({ settings: { quickCreations: [stale, liveFolder] } });
    GenericServer.instance = {
        _template: { workspaces: [root], getGeneralGlobal: async () => ({ templates: {} }) },
        _localProject: { readProjects: async () => ({ templates: {} }) },
        _localTemplate: { readTemplates: async () => ({ templates: {} }) },
        connection: {
            Select: async (items, options) => {
                selected.push([items, options]);
                return items[0];
            },
            showErrorMessage: error => errors.push(error),
        },
    };
    const calls = [];
    TemplateScript.create = async path => {
        calls.push(['create', path]);
        return { name: 'Live', description: 'still installed', init: async (...args) => calls.push(['init', ...args]) };
    };

    await Commands.allCommandes['aventus.template.quick'].run();

    assert.deepEqual(selected.map(([items, options]) => [items.map(item => item.label), options.title]), [
        [['Live'], 'Select quick template'],
    ]);
    assert.deepEqual(calls, [['create', config], ['create', config], ['init', root, root]]);
    assert.deepEqual(errors, []);
});

test('quick creation reports when all configured templates disappeared', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-quick-all-stale-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const prior = [GenericServer.instance, SettingsManager.getInstance, TemplateScript.create];
    t.after(() => {
        [GenericServer.instance, SettingsManager.getInstance, TemplateScript.create] = prior;
    });
    const errors = [];
    SettingsManager.getInstance = () => ({ settings: { quickCreations: [join(root, 'old-a'), join(root, 'old-b')] } });
    GenericServer.instance = {
        _template: { workspaces: [root], getGeneralGlobal: async () => ({ templates: {} }) },
        _localProject: { readProjects: async () => ({ templates: {} }) },
        _localTemplate: { readTemplates: async () => ({ templates: {} }) },
        connection: { Select: () => assert.fail('no selectable template'), showErrorMessage: message => errors.push(message) },
    };
    TemplateScript.create = () => assert.fail('missing script must not be parsed');

    await Commands.allCommandes['aventus.template.quick'].run();

    assert.deepEqual(errors, ['No global template set as quick creation. Try to edit quick creation first']);
});
