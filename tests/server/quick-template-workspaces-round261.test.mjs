import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { TemplateScript }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'cmds/index.ts', 'files/Template.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

test('quick creation selects the workspace before the template and recovers after cancellation', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-quick-workspaces-'));
    const workspaces = [join(root, 'one'), join(root, 'two')];
    const templateDir = join(root, 'template');
    for (const path of [...workspaces, templateDir]) mkdirSync(path);
    const config = join(templateDir, 'template.avt.ts');
    writeFileSync(config, 'fixture');
    const previous = [GenericServer.instance, SettingsManager.getInstance, TemplateScript.create];
    t.after(() => {
        [GenericServer.instance, SettingsManager.getInstance, TemplateScript.create] = previous;
        rmSync(root, { recursive: true, force: true });
    });

    SettingsManager.getInstance = () => ({ settings: { quickCreations: [templateDir] } });
    const selections = [];
    const initialized = [];
    let cancelFirst = true;
    GenericServer.instance = {
        _template: { workspaces },
        connection: {
            Select: async (items, options) => {
                selections.push([items, options]);
                if (cancelFirst) {
                    cancelFirst = false;
                    return undefined;
                }
                return items[1];
            },
            showErrorMessage: message => assert.fail(`unexpected error: ${message}`),
        },
    };
    TemplateScript.create = async path => ({ init: async (...args) => initialized.push([path, ...args]) });

    await Commands.allCommandes['aventus.template.quick'].run();
    assert.deepEqual(initialized, []);
    await Commands.allCommandes['aventus.template.quick'].run();

    assert.deepEqual(selections.map(([items, options]) => [items.map(item => item.label), options.title]), [
        [workspaces, 'Select workspace'],
        [workspaces, 'Select workspace'],
    ]);
    assert.deepEqual(initialized, [[config, workspaces[1], workspaces[1]]]);
});
