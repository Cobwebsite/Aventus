import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { LocalTemplateManager },
    { LocalProjectManager }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'files/LocalTemplate.ts',
    'files/LocalProject.ts', 'GenericServer.ts',
]);

test('workspace template, project and global overlays stay within their workspace', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-workspace-isolation-'));
    const a = join(root, 'a');
    const b = join(root, 'b');
    const installedTemplate = join(root, 'installed', 'templates', 'base', 'template.avt.ts');
    const installedProject = join(root, 'installed', 'projects', 'base', 'template.avt.ts');
    const installedGlobal = join(root, 'installed', 'global', 'base', 'template.avt.ts');
    const localTemplate = join(a, '.aventus', 'templates', 'override', 'template.avt.ts');
    const localProject = join(a, '.aventus', 'projects', 'override', 'template.avt.ts');
    const localGlobal = join(a, '.aventus', 'global', 'override', 'template.avt.ts');
    for (const path of [installedTemplate, installedProject, installedGlobal, localTemplate, localProject, localGlobal]) {
        mkdirSync(join(path, '..'), { recursive: true });
        writeFileSync(path, 'fixture');
    }
    mkdirSync(b);
    const previousServer = GenericServer.instance;
    const previousCreate = TemplateScript.create;
    TemplateScript.create = async config => ({ name: 'Shared', config });
    try {
        const manager = new TemplateManager([pathToFileURL(a).href, pathToFileURL(b).href]);
        const templates = await manager.readTemplates([join(root, 'installed', 'templates')]);
        const projects = await manager.readTemplates([join(root, 'installed', 'projects')]);
        const global = await manager.readTemplates([join(root, 'installed', 'global')]);
        manager.loadedTemplates = templates.templates;
        manager.loadedTemplatesLength = templates.nb;
        manager.loadedProjects = projects.templates;
        manager.loadedProjectsLength = projects.nb;
        manager.loadedGlobal = global.templates;
        manager.loadedGlobalLength = global.nb;

        GenericServer.instance = { workspaces: [pathToFileURL(a).href] };
        assert.equal((await new LocalTemplateManager(manager).readTemplates()).templates.Shared.config, localTemplate);
        assert.equal((await new LocalProjectManager(manager).readProjects()).templates.Shared.config, localProject);
        assert.equal((await manager.readGlobal()).templates.Shared.config, localGlobal);

        GenericServer.instance = { workspaces: [pathToFileURL(b).href] };
        const inBTemplate = await new LocalTemplateManager(manager).readTemplates();
        const inBProject = await new LocalProjectManager(manager).readProjects();
        const inBGlobal = await manager.readGlobal();
        assert.equal(inBTemplate.templates.Shared.config, installedTemplate);
        assert.equal(inBProject.templates.Shared.config, installedProject);
        assert.equal(inBGlobal.templates.Shared.config, installedGlobal);
        assert.equal(manager.getGeneralTemplates().Shared.config, installedTemplate);
        assert.equal(manager.getGeneralProjects().Shared.config, installedProject);
        assert.equal(manager.getGeneralGlobal().Shared.config, installedGlobal);

        GenericServer.instance = { workspaces: [pathToFileURL(a).href] };
        assert.equal((await new LocalTemplateManager(manager).readTemplates()).templates.Shared.config, localTemplate);
        assert.equal((await new LocalProjectManager(manager).readProjects()).templates.Shared.config, localProject);
        assert.equal((await manager.readGlobal()).templates.Shared.config, localGlobal);

        for (const path of [localTemplate, localProject, localGlobal]) rmSync(path);
        assert.equal((await new LocalTemplateManager(manager).readTemplates()).templates.Shared.config, installedTemplate);
        assert.equal((await new LocalProjectManager(manager).readProjects()).templates.Shared.config, installedProject);
        assert.equal((await manager.readGlobal()).templates.Shared.config, installedGlobal);
    } finally {
        TemplateScript.create = previousCreate;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    }
});
