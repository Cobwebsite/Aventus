import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [
    { GenericServer }, { SettingsManager }, { FilesManager }, { ProjectManager },
    { TemplateFileManager }, { ManifestPackage },
] = await loadServerModules([
    'GenericServer.ts', 'settings/Settings.ts', 'files/FilesManager.ts',
    'project/ProjectManager.ts', 'language-services/ts/template/TemplateFileManager.ts',
    'manifest/ManifestPackage.ts',
]);

test('startup remains unavailable after a file scan failure, then retries the scan and manifest', async t => {
    const originals = {
        server: GenericServer.instance, settings: SettingsManager.instance,
        files: FilesManager.getInstance, projects: ProjectManager.getInstance,
        templates: TemplateFileManager.getInstance, manifest: ManifestPackage.write,
    };
    t.after(() => {
        GenericServer.instance = originals.server;
        SettingsManager.instance = originals.settings;
        FilesManager.getInstance = originals.files;
        ProjectManager.getInstance = originals.projects;
        TemplateFileManager.getInstance = originals.templates;
        ManifestPackage.write = originals.manifest;
    });
    const events = [];
    let scanCount = 0;
    SettingsManager.instance = { settings: {
        useTemplates: false, useCompilators: false, loadFiles: true, buildOnly: false,
    } };
    FilesManager.getInstance = () => ({
        loadAllAventusFiles: async roots => {
            events.push(['scan', [...roots]]);
            if (++scanCount === 1) throw Error('scan unavailable');
        },
    });
    ProjectManager.getInstance = () => { events.push('projects'); return {}; };
    TemplateFileManager.getInstance = () => { events.push('templates'); return {}; };
    ManifestPackage.write = async () => { events.push('manifest'); };
    const server = Object.create(GenericServer.prototype);
    server.workspaces = ['file:///first', 'file:///second'];
    server.isLoading = true;
    server.isDown = false;
    GenericServer.instance = server;

    await assert.rejects(server.startServer(), /scan unavailable/);
    assert.equal(server.isLoading, true);
    assert.deepEqual(events, ['projects', 'templates', ['scan', server.workspaces]]);
    await server.startServer();
    assert.equal(server.isLoading, false);
    assert.deepEqual(events, [
        'projects', 'templates', ['scan', server.workspaces],
        'projects', 'templates', ['scan', server.workspaces], 'manifest',
    ]);
});

test('manifest write failure keeps requests gated until a successful retry', async t => {
    const originals = {
        server: GenericServer.instance, settings: SettingsManager.instance,
        files: FilesManager.getInstance, projects: ProjectManager.getInstance,
        templates: TemplateFileManager.getInstance, manifest: ManifestPackage.write,
    };
    t.after(() => {
        GenericServer.instance = originals.server;
        SettingsManager.instance = originals.settings;
        FilesManager.getInstance = originals.files;
        ProjectManager.getInstance = originals.projects;
        TemplateFileManager.getInstance = originals.templates;
        ManifestPackage.write = originals.manifest;
    });
    const events = [];
    let writes = 0;
    SettingsManager.instance = { settings: {
        useTemplates: false, useCompilators: false, loadFiles: true, buildOnly: false,
    } };
    FilesManager.getInstance = () => ({ loadAllAventusFiles: async () => events.push('scan') });
    ProjectManager.getInstance = () => ({});
    TemplateFileManager.getInstance = () => ({});
    ManifestPackage.write = async () => {
        events.push('manifest');
        if (++writes === 1) throw Error('manifest unavailable');
    };
    const server = Object.create(GenericServer.prototype);
    server.workspaces = ['file:///first'];
    server.isLoading = true;
    server.isDown = false;
    GenericServer.instance = server;

    await assert.rejects(server.startServer(), /manifest unavailable/);
    assert.equal(server.isLoading, true);
    assert.equal(GenericServer.isAllowed({ uri: 'file:///first/view.wc.avt' }), false);
    await server.startServer();
    assert.equal(server.isLoading, false);
    assert.deepEqual(events, ['scan', 'manifest', 'scan', 'manifest']);
});
