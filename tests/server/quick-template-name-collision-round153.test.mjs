import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { TemplateScript }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'cmds/index.ts', 'files/Template.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

test('quick creation with duplicate display names routes either selection to the last path', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-quick-duplicate-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const paths = ['first', 'second'].map(name => {
        const folder = join(root, name);
        mkdirSync(folder);
        const path = join(folder, 'template.avt.ts');
        writeFileSync(path, 'fixture');
        return path;
    });
    const prior = [GenericServer.instance, SettingsManager.getInstance, TemplateScript.create];
    t.after(() => {
        [GenericServer.instance, SettingsManager.getInstance, TemplateScript.create] = prior;
    });

    const selections = [];
    const initialized = [];
    SettingsManager.getInstance = () => ({ settings: { quickCreations: paths } });
    GenericServer.instance = {
        _template: { workspaces: [root], getGeneralGlobal: async () => ({ templates: {} }) },
        _localProject: { readProjects: async () => ({ templates: {} }) },
        _localTemplate: { readTemplates: async () => ({ templates: {} }) },
        connection: {
            Select: async (items, options) => {
                selections.push([items, options]);
                return items[0];
            },
            showErrorMessage: message => assert.fail(`unexpected error: ${message}`),
        },
    };
    TemplateScript.create = async path => ({
        name: 'Duplicate', description: path,
        init: async (...args) => initialized.push([path, ...args]),
    });

    await Commands.allCommandes['aventus.template.quick'].run();

    assert.deepEqual(selections.map(([items, options]) => [items.map(item => item.detail), options.title]), [
        [paths, 'Select quick template'],
    ]);
    assert.deepEqual(initialized, [[paths[1], root, root]]);
});
