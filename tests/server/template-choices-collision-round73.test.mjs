import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { TemplateManager }, { TemplateScript }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'cmds/index.ts', 'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

test('quick edit reports two same-named templates before selection', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-quick-collision-'));
    const previous = [GenericServer.instance, SettingsManager.getInstance];
    const first = Object.assign(Object.create(TemplateScript.prototype), {
        name: 'Shared', description: 'first', folderPath: join(root, 'first'), allowQuick: true,
    });
    const second = Object.assign(Object.create(TemplateScript.prototype), {
        name: 'Shared', description: 'second', folderPath: join(root, 'second'), allowQuick: true,
    });
    const saved = [];
    const errors = [];
    SettingsManager.getInstance = () => ({
        settings: { quickCreations: [] },
        setSettings: (...args) => saved.push(args),
    });
    GenericServer.instance = {
        _template: { readGlobal: async () => ({ templates: { first } }) },
        _localProject: { readProjects: async () => ({ templates: { second } }) },
        _localTemplate: { readTemplates: async () => ({ templates: {} }) },
        connection: {
            SelectMultiple: async () => assert.fail('selection must not open for duplicate names'),
            showErrorMessage: message => errors.push(message),
        },
    };
    try {
        await Commands.allCommandes['aventus.template.quick_edit'].run();
        assert.deepEqual(saved, []);
        assert.deepEqual(errors, [`You have 2 templates with the same names : ${first.folderPath} and ${second.folderPath}`]);
    } finally {
        [GenericServer.instance, SettingsManager.getInstance] = previous;
        rmSync(root, { recursive: true, force: true });
    }
});

test('project uninstall removes multiple selected folders including a missing one and leaves other projects', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-project-uninstall-'));
    const previous = GenericServer.instance;
    const folders = ['first', 'missing', 'third', 'keep'].map(name => join(root, name));
    for (const folder of [folders[0], folders[2], folders[3]]) {
        mkdirSync(folder);
        writeFileSync(join(folder, 'template.avt.ts'), 'fixture');
    }
    const scripts = folders.map((folder, index) => Object.assign(Object.create(TemplateScript.prototype), {
        name: ['group.First', 'group.Missing', 'group.Third', 'group.Keep'][index], config: join(folder, 'template.avt.ts'),
    }));
    const notifications = [];
    let reloads = 0;
    GenericServer.instance = { connection: {
        SelectMultiple: async items => {
            assert.deepEqual(items.map(item => item.label), ['group.First', 'group.Missing', 'group.Third', 'group.Keep']);
            return items.slice(0, 3);
        },
        showInformationMessage: message => notifications.push(message),
    } };
    const manager = Object.create(TemplateManager.prototype);
    manager.loadedProjects = { group: { First: scripts[0], Missing: scripts[1], Third: scripts[2], Keep: scripts[3] } };
    manager.projectPath = [root];
    manager.reloadProjects = async () => { reloads++; };
    try {
        await manager.selectProjectToUninstall();
        assert.deepEqual(folders.map(folder => existsSync(folder)), [false, false, false, true]);
        assert.equal(reloads, 1);
        assert.deepEqual(notifications, ['Projects deleted']);
    } finally {
        GenericServer.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
