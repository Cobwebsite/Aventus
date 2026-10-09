import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [
    { GenericServer }, { SettingsManager }, { FilesManager }, { ProjectManager },
    { TemplateFileManager }, { ManifestPackage }, { InitStep },
] = await loadServerModules([
    'GenericServer.ts', 'settings/Settings.ts', 'files/FilesManager.ts',
    'project/ProjectManager.ts', 'language-services/ts/template/TemplateFileManager.ts',
    'manifest/ManifestPackage.ts', 'notification/InitStep.ts',
]);

async function startup(settings, configure) {
    const original = {
        settings: SettingsManager.instance,
        files: FilesManager.getInstance,
        projects: ProjectManager.getInstance,
        templates: TemplateFileManager.getInstance,
        manifest: ManifestPackage.write,
        done: InitStep.sendDone,
        server: GenericServer.instance,
    };
    const events = [];
    const files = {
        loadConfigFile: async (...args) => events.push(['config', ...args]),
        loadConfigFileNotSet: async (...args) => events.push(['discover', ...args]),
        loadAllAventusFiles: async (...args) => events.push(['all', ...args]),
    };
    SettingsManager.instance = { settings };
    FilesManager.getInstance = () => files;
    ProjectManager.getInstance = () => { events.push(['project']); return {}; };
    TemplateFileManager.getInstance = () => { events.push(['template']); return {}; };
    ManifestPackage.write = async () => events.push(['manifest']);
    InitStep.sendDone = () => events.push(['done']);
    const server = Object.create(GenericServer.prototype);
    server.workspaces = ['file:///first', 'file:///second'];
    server.isLoading = true;
    GenericServer.instance = server;
    try {
        await configure?.(server, events);
        await server.startServer();
        assert.equal(server.isLoading, false);
        return events;
    } finally {
        SettingsManager.instance = original.settings;
        FilesManager.getInstance = original.files;
        ProjectManager.getInstance = original.projects;
        TemplateFileManager.getInstance = original.templates;
        ManifestPackage.write = original.manifest;
        InitStep.sendDone = original.done;
        GenericServer.instance = original.server;
    }
}

test('full startup loads workspace files before writing the package manifest', async () => {
    const events = await startup({ useTemplates: false, useCompilators: false, loadFiles: true, buildOnly: false });
    assert.deepEqual(events, [
        ['project'], ['template'], ['all', ['file:///first', 'file:///second']], ['manifest'],
    ]);
});

test('CLI startup with explicit config forwards build and static filters without scanning workspaces', async () => {
    const events = await startup({
        useTemplates: false, useCompilators: false, loadFiles: true, buildOnly: true,
        configPath: 'file:///config/aventus.conf.avt', builds: ['app'], statics: ['assets'],
    });
    assert.deepEqual(events, [
        ['project'], ['template'], ['config', 'file:///config/aventus.conf.avt', ['app'], ['assets']],
    ]);
});

test('CLI startup without explicit config discovers across the supplied workspace roots', async () => {
    const events = await startup({
        useTemplates: false, useCompilators: false, loadFiles: true, buildOnly: true,
        builds: ['app'], statics: ['assets'],
    });
    assert.deepEqual(events, [
        ['project'], ['template'], ['discover', ['file:///first', 'file:///second'], ['app'], ['assets']],
    ]);
});

test('startup with file loading disabled announces completion without scanning or writing manifests', async () => {
    const events = await startup({ useTemplates: false, useCompilators: false, loadFiles: false });
    assert.deepEqual(events, [['project'], ['template'], ['done']]);
});
