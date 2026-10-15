import assert from 'node:assert/strict';
import { join } from 'node:path';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ProjectManager }, { FilesManager }, { Build }, { SettingsManager },
    { GenericServer }, { DependencyManager }] = await loadServerModules([
    'project/ProjectManager.ts', 'files/FilesManager.ts', 'project/Build.ts',
    'settings/Settings.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
]);

function definition(className, attribute) {
    return { 'shared-card': { name: 'shared-card', class: className,
        attributes: { [attribute]: { name: attribute, values: [] } } } };
}

test('project manager config replacement gives each build a fresh HTML definition registry', async t => {
    const old = {
        files: FilesManager.instance, settings: SettingsManager.instance,
        server: GenericServer.instance, dependency: DependencyManager.instance,
        autoLoad: ProjectManager.autoLoad, init: Build.prototype.init,
    };
    FilesManager.instance = { getByUri: () => undefined,
        onNewFile: () => 'subscription', removeOnNewFile: () => {} };
    SettingsManager.instance = {
        settings: { defaultHideWarnings: false, watchFiles: false, useStats: false },
        settingsHtml: { customData: [] }, onSettingsChange: () => 'settings',
        onSettingsChangeHtml: () => 'html',
    };
    GenericServer.instance = {
        workspaces: ['file:///workspace'], logLevel: 99, isIDE: false,
        _extensionPath: join(import.meta.dirname, '..', '..'),
        connection: { sendNotification: () => {} },
    };
    DependencyManager.instance = { getPath: () => join(import.meta.dirname, '..', '..') };
    ProjectManager.autoLoad = false;
    Build.prototype.init = async function () { this.initDone = true; };
    t.after(() => {
        FilesManager.instance = old.files;
        SettingsManager.instance = old.settings;
        GenericServer.instance = old.server;
        DependencyManager.instance = old.dependency;
        ProjectManager.autoLoad = old.autoLoad;
        Build.prototype.init = old.init;
    });

    const uri = 'file:///workspace/app/aventus.conf.avt';
    const events = new Map();
    const file = { uri, path: '/workspace/app/aventus.conf.avt',
        folderUri: 'file:///workspace/app', validate: () => {} };
    for (const event of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover', 'Delete']) {
        file[`on${event}`] = callback => { events.set(event, callback); return event; };
        file[`removeOn${event}`] = () => events.delete(event);
    }
    const setConfig = (version, name) => {
        file.documentUser = TextDocument.create(uri, 'json', version,
            JSON.stringify({ module: 'App', build: [{ name, src: [] }] }));
    };
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};
    setConfig(1, 'first');
    await manager.onNewFile(file);
    const project = manager.getProjectByUri(uri);
    await project.init();
    const first = project.getBuild('App@first');
    const internalUri = 'file:///workspace/app/card.wcl.avt';
    const internalFile = { uri: internalUri };
    first.htmlLanguageService.addExternalDefinition('file:///workspace/pkg-first',
        definition('ExternalFirst', 'external-first'));
    first.htmlLanguageService.addInternalDefinition(internalUri,
        definition('InternalFirst', 'internal-first'), internalFile);
    assert.equal(first.htmlLanguageService.getClassByTag('shared-card'), 'InternalFirst');

    setConfig(2, 'second');
    await project.onConfigSave();
    assert.deepEqual(manager.getAllBuilds(), [{ name: 'App@second', uri }]);
    const second = project.getBuild('App@second');
    assert.notEqual(second, first);
    assert.equal(second.htmlLanguageService.getClassByTag('shared-card'), null);
    assert.equal(second.htmlLanguageService.getInternalDefinition('shared-card'), undefined);
    second.htmlLanguageService.addExternalDefinition('file:///workspace/pkg-second',
        definition('ExternalSecond', 'external-second'));
    assert.equal(second.htmlLanguageService.getClassByTag('shared-card'), 'ExternalSecond');
    const attrs = second.htmlLanguageService.provideAttributes('shared-card').map(a => a.name);
    assert.ok(attrs.includes('external-second'));
    assert.ok(!attrs.includes('internal-first'));
    assert.ok(!attrs.includes('external-first'));
    assert.equal(first.htmlLanguageService.getClassByTag('shared-card'), 'InternalFirst');

    await events.get('Delete')(file);
    assert.equal(manager.getProjectByUri(uri), undefined);
    setConfig(3, 'third');
    await manager.onNewFile(file);
    const recreated = manager.getProjectByUri(uri);
    await recreated.init();
    assert.equal(recreated.getBuild('App@third').htmlLanguageService.getClassByTag('shared-card'), null);
    await events.get('Delete')(file);
});
