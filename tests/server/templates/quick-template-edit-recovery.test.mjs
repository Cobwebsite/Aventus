import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { TemplateScript }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'cmds/index.ts', 'files/Template.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

test('quick edit clears removed choices, then discovers a new eligible template on the next run', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-quick-edit-recovery-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const prior = [GenericServer.instance, SettingsManager.getInstance];
    t.after(() => { [GenericServer.instance, SettingsManager.getInstance] = prior; });

    const settings = { quickCreations: [join(root, 'removed')] };
    const saved = [];
    const errors = [];
    let available = {};
    let selection = null;
    SettingsManager.getInstance = () => ({
        settings,
        setSettings: (values, persist) => {
            saved.push([values, persist]);
            Object.assign(settings, values);
        },
    });
    GenericServer.instance = {
        _template: { readGlobal: async () => ({ templates: available }) },
        _localProject: { readProjects: async () => ({ templates: {} }) },
        _localTemplate: { readTemplates: async () => ({ templates: {} }) },
        connection: {
            SelectMultiple: async (items, options) => {
                assert.equal(options.title, 'Select quick templates');
                assert.deepEqual(items.map(item => [item.label, item.picked]), [['New', false]]);
                return selection;
            },
            showErrorMessage: message => errors.push(message),
        },
    };
    const edit = Commands.allCommandes['aventus.template.quick_edit'];

    await edit.run();
    assert.deepEqual(settings.quickCreations, []);
    assert.deepEqual(saved, [[{ quickCreations: [] }, true]]);
    assert.deepEqual(errors, ['No template/project allow quick creation']);

    const candidate = Object.assign(Object.create(TemplateScript.prototype), {
        name: 'New', description: 'available now', folderPath: join(root, 'new'), allowQuick: true,
    });
    available = { New: candidate };
    await edit.run();
    assert.deepEqual(saved, [[{ quickCreations: [] }, true]]);

    selection = [{ label: 'New' }];
    await edit.run();
    assert.deepEqual(settings.quickCreations, [candidate.folderPath]);
    assert.deepEqual(saved, [
        [{ quickCreations: [] }, true],
        [{ quickCreations: [candidate.folderPath] }, true],
    ]);
    assert.deepEqual(errors, ['No template/project allow quick creation']);
});
