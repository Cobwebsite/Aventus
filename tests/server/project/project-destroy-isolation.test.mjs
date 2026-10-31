import assert from 'node:assert/strict';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }, { Build }, { FilesManager }, { SettingsManager }, { GenericServer }] =
    await loadServerModules([
        'project/Project.ts', 'project/Build.ts', 'files/FilesManager.ts',
        'settings/Settings.ts', 'GenericServer.ts',
    ]);

test('destroying one of two projects releases only its build, config listeners and pending timer', async t => {
    const previous = {
        files: FilesManager.instance,
        settings: SettingsManager.instance,
        server: GenericServer.instance,
    };
    const fileListeners = new Map();
    const removedFiles = [];
    const notifications = [];
    let nextId = 0;
    FilesManager.instance = {
        onNewFile: callback => {
            const id = `file-${++nextId}`;
            fileListeners.set(id, callback);
            return id;
        },
        removeOnNewFile: id => {
            removedFiles.push(id);
            fileListeners.delete(id);
        },
    };
    SettingsManager.instance = {
        settings: { defaultHideWarnings: false, watchFiles: false, useStats: false },
        settingsHtml: { customData: [] },
        onSettingsChange: () => 'settings', onSettingsChangeHtml: () => 'html',
    };
    GenericServer.instance = {
        logLevel: 0,
        connection: { sendNotification: (...args) => notifications.push(args) },
    };
    t.after(() => {
        FilesManager.instance = previous.files;
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
    });

    const configs = [];
    const makeProject = name => {
        const listeners = new Map();
        const removals = [];
        const file = {
            path: join('D:', name, 'aventus.conf.avt'),
            folderUri: `file:///D:/${name}`,
            validate() {},
        };
        for (const event of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
            file[`on${event}`] = callback => {
                const id = `${name}-${event}`;
                listeners.set(id, callback);
                return id;
            };
            file[`removeOn${event}`] = id => {
                removals.push(id);
                listeners.delete(id);
            };
        }
        configs.push({ listeners, removals });
        const project = new Project(file, false);
        const build = Object.create(Build.prototype);
        Object.assign(build, {
            project,
            buildConfig: { fullname: `${name}@web` },
            onNewFileUUID: FilesManager.instance.onNewFile(() => {}),
            scssFiles: {}, htmlFiles: {}, tsFiles: {}, i18nComponentsFiles: {},
            tsLanguageService: { i18nFiles: {} }, onFileDeleteUUIDs: {},
        });
        project.builds.push(build);
        return { project, build };
    };
    const first = makeProject('first');
    const second = makeProject('second');
    let firstTimerRan = false;
    let secondTimerRan = false;
    first.build.timerBuild = setTimeout(() => { firstTimerRan = true; }, 40);
    second.build.timerBuild = setTimeout(() => { secondTimerRan = true; }, 40);

    assert.equal(fileListeners.size, 4);
    first.project.destroy();
    assert.deepEqual(removedFiles, ['file-1', 'file-2']);
    assert.deepEqual([...fileListeners.keys()], ['file-3', 'file-4']);
    assert.equal(configs[0].listeners.size, 0);
    assert.equal(configs[1].listeners.size, 6);
    assert.equal(configs[0].removals.length, 6);
    assert.equal(configs[1].removals.length, 0);
    assert.equal(first.build.destroyed, true);
    assert.equal(second.build.destroyed, undefined);
    assert.deepEqual(notifications.map(([method]) => method), ['aventus/unregisterBuild']);

    await new Promise(resolve => setTimeout(resolve, 90));
    assert.equal(firstTimerRan, false);
    assert.equal(secondTimerRan, true);
    second.project.destroy();
    assert.equal(fileListeners.size, 0);
    assert.deepEqual(removedFiles, ['file-1', 'file-2', 'file-3', 'file-4']);
    assert.equal(configs[1].listeners.size, 0);
    assert.equal(configs[1].removals.length, 6);
    assert.deepEqual(notifications.map(([method]) => method), [
        'aventus/unregisterBuild', 'aventus/unregisterBuild',
    ]);
});
