import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { Build }, { Mutex }, { FilesManager }, { DependencyManager },
    { GenericServer }, { SettingsManager }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'Mutex.ts', 'files/FilesManager.ts',
    'project/DependencyManager.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

test('destroy during config loading does not create a subscribed build after destruction', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-project-destroy-inflight-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const before = {
        files: FilesManager.instance, dependency: DependencyManager.instance,
        server: GenericServer.instance, settings: SettingsManager.instance,
        init: Build.prototype.init,
    };
    const subscriptions = new Set();
    const notifications = [];
    let nextId = 0;
    FilesManager.instance = {
        onNewFile: () => { const id = `new-${++nextId}`; subscriptions.add(id); return id; },
        removeOnNewFile: id => subscriptions.delete(id),
    };
    DependencyManager.instance = { getPath: () => root };
    GenericServer.instance = {
        logLevel: 0, _extensionPath: join(import.meta.dirname, '..', '..'),
        connection: { sendNotification: (...args) => notifications.push(args) },
    };
    SettingsManager.instance = {
        settings: { defaultHideWarnings: false, watchFiles: false, useStats: false },
        settingsHtml: { customData: [] },
        onSettingsChange: () => 'settings', onSettingsChangeHtml: () => 'html',
    };
    Build.prototype.init = async function () { this.initDone = true; };
    t.after(() => {
        FilesManager.instance = before.files;
        DependencyManager.instance = before.dependency;
        GenericServer.instance = before.server;
        SettingsManager.instance = before.settings;
        Build.prototype.init = before.init;
    });

    const configFile = { path: join(root, 'aventus.conf.avt') };
    for (const name of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        configFile[`removeOn${name}`] = () => {};
    }
    const project = Object.create(Project.prototype);
    Object.assign(project, {
        configFile, config: null, builds: [], statics: [], scssFiles: {},
        onConfigSaveMutex: new Mutex(), onNewFileUUID: 'project-new-file',
    });
    let releaseLoad;
    let loadStarted;
    const loading = new Promise(resolve => { releaseLoad = resolve; });
    const started = new Promise(resolve => { loadStarted = resolve; });
    project.loadConfig = async () => {
        loadStarted();
        await loading;
        project.config = {
            build: [{ name: 'web', fullname: 'Demo@web', module: 'Demo', compile: [] }],
            static: [],
        };
    };

    const saving = project.onConfigSave();
    await started;
    project.destroy();
    assert.deepEqual([...subscriptions], []);
    releaseLoad();
    await saving;

    assert.deepEqual(project.getBuildsName(), []);
    assert.deepEqual([...subscriptions], []);
    assert.deepEqual(notifications, []);
});

test('destroy during compilation lets the already running build write its output', async t => {
    const before = { files: FilesManager.instance, server: GenericServer.instance };
    const events = [];
    FilesManager.instance = { removeOnNewFile: () => events.push('unsubscribed') };
    GenericServer.instance = {
        isIDE: false, _noBuild: false, logLevel: 0,
        connection: {
            delayBetweenBuild: () => 0,
            sendNotification: name => events.push(name),
        },
    };
    t.after(() => {
        FilesManager.instance = before.files;
        GenericServer.instance = before.server;
    });

    const build = Object.create(Build.prototype);
    Object.assign(build, {
        initDone: true, _allowBuild: true,
        buildConfig: { fullname: 'Demo@web', module: 'Demo', compile: [{
            package: [], outputNpm: { live: false }, output: [], compressed: false,
        }] },
        project: { getConfigFile: () => ({ path: 'D:/demo/aventus.conf.avt' }) },
        onNewFileUUID: 'subscription', onFileDeleteUUIDs: {},
        scssFiles: {}, htmlFiles: {}, tsFiles: {}, i18nComponentsFiles: {},
        tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(),
    });
    let releaseCompilation;
    let compilationStarted;
    const blocked = new Promise(resolve => { releaseCompilation = resolve; });
    const started = new Promise(resolve => { compilationStarted = resolve; });
    build.buildOrderCompilationInfo = async () => {
        compilationStarted();
        await blocked;
        return { toCompile: [], libSrc: [], errors: [] };
    };
    build.buildLocalCode = async () => ({ codeRenderInJs: [], codeNotRenderInJs: [] });
    build.writeBuildCode = async () => { events.push('output written'); return []; };
    build.writeBuildDocumentation = async () => {};

    const compiling = build.build();
    await started;
    build.destroy();
    assert.deepEqual(events.slice(0, 2), ['unsubscribed', 'aventus/unregisterBuild']);
    releaseCompilation();
    await compiling;
    assert.ok(events.indexOf('output written') > events.indexOf('aventus/unregisterBuild'));
});
