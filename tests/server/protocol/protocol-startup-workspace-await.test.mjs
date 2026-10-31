import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [
    { GenericServer }, { SettingsManager }, { FilesManager }, { ProjectManager },
    { TemplateFileManager: TemplateFileTsManager }, { ManifestPackage },
] = await loadServerModules([
    'GenericServer.ts', 'settings/Settings.ts', 'files/FilesManager.ts',
    'project/ProjectManager.ts', 'language-services/ts/template/TemplateFileManager.ts',
    'manifest/ManifestPackage.ts',
]);

test('workspace startup waits for both roots to finish loading before writing the manifest and becoming ready', async t => {
    const originals = {
        server: GenericServer.instance, settings: SettingsManager.instance,
        files: FilesManager.getInstance, projects: ProjectManager.getInstance,
        templates: TemplateFileTsManager.getInstance, manifest: ManifestPackage.write,
    };
    t.after(() => {
        GenericServer.instance = originals.server;
        SettingsManager.instance = originals.settings;
        FilesManager.getInstance = originals.files;
        ProjectManager.getInstance = originals.projects;
        TemplateFileTsManager.getInstance = originals.templates;
        ManifestPackage.write = originals.manifest;
    });

    const events = [];
    let finishLoading;
    let finishManifest;
    const loading = new Promise(resolve => { finishLoading = resolve; });
    const manifest = new Promise(resolve => { finishManifest = resolve; });
    SettingsManager.instance = { settings: {
        useTemplates: false, useCompilators: false, loadFiles: true, buildOnly: false,
    } };
    FilesManager.getInstance = () => ({
        loadAllAventusFiles: async roots => { events.push(['load', roots]); await loading; events.push('loaded'); },
    });
    ProjectManager.getInstance = () => { events.push('projects'); return {}; };
    TemplateFileTsManager.getInstance = () => { events.push('typescript templates'); return {}; };
    ManifestPackage.write = async () => { events.push('manifest'); await manifest; events.push('manifest written'); };

    const server = Object.create(GenericServer.prototype);
    server.workspaces = ['file:///workspace-a', 'file:///workspace-b'];
    server.isLoading = true;
    GenericServer.instance = server;
    const started = server.startServer();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(events, ['projects', 'typescript templates',
        ['load', ['file:///workspace-a', 'file:///workspace-b']]]);
    assert.equal(server.isLoading, true);

    finishLoading();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(events.at(-2), 'loaded');
    assert.deepEqual(events.at(-1), 'manifest');
    assert.equal(server.isLoading, true);

    finishManifest();
    await started;
    assert.equal(events.at(-1), 'manifest written');
    assert.equal(server.isLoading, false);
});
