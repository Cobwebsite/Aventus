import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { LocalTemplateManager }, { LocalProjectManager },
    { GenericServer }, { SettingsManager }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'files/LocalTemplate.ts', 'files/LocalProject.ts',
    'GenericServer.ts', 'settings/Settings.ts',
]);

function script(folder) {
    mkdirSync(folder, { recursive: true });
    const path = join(folder, 'template.avt.ts');
    writeFileSync(path, 'fixture');
    return path;
}

test('settings notification reloads all three registries and discovery uses the new entries', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-event-'));
    const save = join(root, 'save');
    script(join(save, 'projects', 'keep'));
    const paths = {};
    for (const kind of ['template', 'project', 'global']) {
        for (const n of [1, 2]) paths[`${kind}${n}`] = script(join(root, `${kind}${n}`, 'entry'));
    }
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    const oldCreate = TemplateScript.create;
    let notify;
    const settings = {
        templatePath: [join(root, 'template1')], projectPath: [join(root, 'project1')],
        globalPath: [join(root, 'global1')],
    };
    SettingsManager.instance = { settings, onSettingsChange(callback) { notify = callback; } };
    GenericServer.instance = { _savePath: save, logLevel: 99, isIDE: false };
    TemplateScript.create = async config => ({ name: `entry${config.includes('2') ? '2' : '1'}`, config });
    try {
        const manager = new TemplateManager([]);
        await manager.init();
        assert.equal(typeof notify, 'function');
        assert.deepEqual(Object.keys(manager.getGeneralTemplates()), ['entry1']);
        assert.deepEqual(Object.keys(manager.getGeneralProjects()), ['entry1']);
        assert.deepEqual(Object.keys(manager.getGeneralGlobal()), ['entry1']);
        for (const kind of ['template', 'project', 'global']) settings[`${kind}Path`] = [join(root, `${kind}2`)];
        notify();
        // The callback intentionally does not return the loading promise.
        for (let i = 0; i < 50 && !manager.getGeneralGlobal().entry2; i++) await new Promise(r => setTimeout(r, 5));
        assert.equal(manager.getGeneralTemplates().entry2.config, paths.template2);
        assert.equal(manager.getGeneralProjects().entry2.config, paths.project2);
        assert.equal(manager.getGeneralGlobal().entry2.config, paths.global2);
        assert.equal(manager.getGeneralTemplates().entry1, undefined);
    } finally {
        TemplateScript.create = oldCreate;
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        rmSync(root, { recursive: true, force: true });
    }
});

test('workspace entries override installed templates and projects during actual filesystem discovery', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-local-priority-'));
    const installedTemplates = join(root, 'installed-templates');
    const installedProjects = join(root, 'installed-projects');
    const installedGlobal = join(root, 'installed-global');
    const localTemplate = script(join(root, '.aventus', 'templates', 'local'));
    const localProject = script(join(root, '.aventus', 'projects', 'local'));
    const localGlobal = script(join(root, '.aventus', 'global', 'local'));
    const baseTemplate = script(join(installedTemplates, 'base'));
    const baseProject = script(join(installedProjects, 'base'));
    const baseGlobal = script(join(installedGlobal, 'base'));
    const oldServer = GenericServer.instance;
    const oldCreate = TemplateScript.create;
    const scripts = new Map([
        [localTemplate, 'local-template'], [localProject, 'local-project'], [localGlobal, 'local-global'],
        [baseTemplate, 'base-template'], [baseProject, 'base-project'], [baseGlobal, 'base-global'],
    ]);
    TemplateScript.create = async config => ({ name: 'Shared', config, origin: scripts.get(config) });
    GenericServer.instance = { workspaces: [pathToFileURL(root).href] };
    try {
        const manager = new TemplateManager([pathToFileURL(root).href]);
        const [templates, projects, global] = await Promise.all([
            manager.readTemplates([installedTemplates]), manager.readTemplates([installedProjects]),
            manager.readTemplates([installedGlobal]),
        ]);
        manager.loadedTemplates = templates.templates;
        manager.loadedTemplatesLength = templates.nb;
        manager.loadedProjects = projects.templates;
        manager.loadedProjectsLength = projects.nb;
        manager.loadedGlobal = global.templates;
        manager.loadedGlobalLength = global.nb;
        const localTemplates = await new LocalTemplateManager(manager).readTemplates();
        const localProjects = await new LocalProjectManager(manager).readProjects();
        const localGlobals = await manager.readGlobal();
        assert.equal(localTemplates.templates.Shared.origin, 'local-template');
        assert.equal(localProjects.templates.Shared.origin, 'local-project');
        assert.equal(localGlobals.templates.Shared.origin, 'local-global');
        assert.deepEqual([localTemplates.nb, localProjects.nb, localGlobals.nb], [2, 2, 2]);
        assert.equal(manager.getGeneralTemplates().Shared.origin, 'local-template');
        assert.equal(manager.getGeneralProjects().Shared.origin, 'local-project');
        assert.equal(manager.getGeneralGlobal().Shared.origin, 'local-global');
    } finally {
        TemplateScript.create = oldCreate;
        GenericServer.instance = oldServer;
        rmSync(root, { recursive: true, force: true });
    }
});
