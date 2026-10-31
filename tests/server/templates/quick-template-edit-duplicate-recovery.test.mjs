import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { TemplateScript }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'cmds/index.ts', 'files/Template.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

test('quick edit rejects duplicate names across registries and recovers when one template is removed', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-quick-edit-duplicate-'));
    const globalPath = join(root, 'global');
    const projectPath = join(root, 'project');
    mkdirSync(globalPath);
    mkdirSync(projectPath);
    const previous = [GenericServer.instance, SettingsManager.getInstance];
    t.after(() => {
        [GenericServer.instance, SettingsManager.getInstance] = previous;
        rmSync(root, { recursive: true, force: true });
    });

    const entry = folderPath => Object.assign(Object.create(TemplateScript.prototype), {
        name: 'Shared', description: folderPath, folderPath, allowQuick: true,
    });
    const globalTemplate = entry(globalPath);
    const localProject = entry(projectPath);
    const settings = { quickCreations: [globalPath] };
    const saves = [];
    const errors = [];
    const selections = [];
    let projects = { Shared: localProject };
    SettingsManager.getInstance = () => ({
        settings,
        setSettings: (value, persist) => {
            saves.push([value, persist]);
            Object.assign(settings, value);
        },
    });
    GenericServer.instance = {
        _template: { readGlobal: async () => ({ templates: { Shared: globalTemplate } }) },
        _localProject: { readProjects: async () => ({ templates: projects }) },
        _localTemplate: { readTemplates: async () => ({ templates: {} }) },
        connection: {
            SelectMultiple: async (items, options) => {
                selections.push([items.map(item => [item.label, item.picked]), options.title]);
                return items;
            },
            showErrorMessage: message => errors.push(message),
        },
    };

    const command = Commands.allCommandes['aventus.template.quick_edit'];
    await command.run();
    assert.deepEqual(selections, []);
    assert.deepEqual(saves, []);
    assert.deepEqual(settings.quickCreations, [globalPath]);
    assert.deepEqual(errors, [`You have 2 templates with the same names : ${globalPath} and ${projectPath}`]);

    projects = {};
    await command.run();
    assert.deepEqual(selections, [[[['Shared', true]], 'Select quick templates']]);
    assert.deepEqual(saves, [[{ quickCreations: [globalPath] }, true]]);
    assert.deepEqual(settings.quickCreations, [globalPath]);
    assert.equal(errors.length, 1);
});
