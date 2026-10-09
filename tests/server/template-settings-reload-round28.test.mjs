import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

test('template manager reloads all three registries after configured paths change', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-settings-'));
    const save = join(root, 'save');
    const pathFor = (kind, generation) => join(root, `${kind}-${generation}`);
    const scriptFor = (kind, generation) => {
        const folder = join(pathFor(kind, generation), kind);
        mkdirSync(folder, { recursive: true });
        const config = join(folder, 'template.avt.ts');
        writeFileSync(config, 'fixture');
        return config;
    };
    const scripts = new Map();
    for (const kind of ['template', 'project', 'global']) {
        for (const generation of [1, 2]) {
            scripts.set(scriptFor(kind, generation), `${kind}${generation}`);
        }
    }
    mkdirSync(join(save, 'projects'), { recursive: true });
    writeFileSync(join(save, 'projects', 'keep.txt'), 'avoid first-install prompt');
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    const oldCreate = TemplateScript.create;
    const settings = {
        templatePath: [pathFor('template', 1)],
        projectPath: [pathFor('project', 1)],
        globalPath: [pathFor('global', 1)],
    };
    SettingsManager.instance = { settings, onSettingsChange() {} };
    GenericServer.instance = { _savePath: save, logLevel: 99 };
    TemplateScript.create = async config => ({ name: scripts.get(config), config });
    try {
        const manager = new TemplateManager([]);
        await manager.loadTemplates();
        assert.deepEqual(Object.keys(manager.getGeneralTemplates()), ['template1']);
        assert.deepEqual(Object.keys(manager.getGeneralProjects()), ['project1']);
        assert.deepEqual(Object.keys(manager.getGeneralGlobal()), ['global1']);
        assert.deepEqual([
            manager.getGeneralTemplatesLength(), manager.getGeneralProjectsLength(), manager.getGeneralGlobalLength(),
        ], [1, 1, 1]);

        settings.templatePath = [pathFor('template', 2)];
        settings.projectPath = [pathFor('project', 2)];
        settings.globalPath = [pathFor('global', 2)];
        await manager.loadTemplates();
        assert.deepEqual(Object.keys(manager.getGeneralTemplates()), ['template2']);
        assert.deepEqual(Object.keys(manager.getGeneralProjects()), ['project2']);
        assert.deepEqual(Object.keys(manager.getGeneralGlobal()), ['global2']);
        assert.deepEqual([
            manager.getGeneralTemplatesLength(), manager.getGeneralProjectsLength(), manager.getGeneralGlobalLength(),
        ], [1, 1, 1]);
    } finally {
        TemplateScript.create = oldCreate;
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        rmSync(root, { recursive: true, force: true });
    }
});
