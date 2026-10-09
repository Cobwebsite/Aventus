import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { FilesManager }, { GenericServer }, { SettingsManager }] =
    await loadServerModules([
        'project/Build.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'settings/Settings.ts',
    ]);

test('build destruction unsubscribes every registered file category and announces removal', () => {
    const calls = [];
    const file = name => ({
        removeEvents: () => calls.push(['events', name]),
        file: { removeOnDelete: id => calls.push(['delete', name, id]) },
    });
    const build = Object.create(Build.prototype);
    build.onNewFileUUID = 'new-file';
    build.onFileDeleteUUIDs = Object.fromEntries(['style', 'view', 'logic', 'translation', 'component-translation']
        .map(name => [name, `delete-${name}`]));
    build.scssFiles = { style: file('style') };
    build.htmlFiles = { view: file('view') };
    build.tsFiles = { logic: file('logic') };
    build.tsLanguageService = { i18nFiles: { translation: file('translation') } };
    build.i18nComponentsFiles = { 'component-translation': file('component-translation') };
    build.project = { getConfigFile: () => ({ path: 'D:/app/aventus.conf.avt' }) };
    build.buildConfig = { fullname: 'Demo@web' };
    FilesManager.instance = { removeOnNewFile: id => calls.push(['new-file', id]) };
    GenericServer.instance = {
        logLevel: 4,
        connection: { sendNotification: (name, args) => calls.push(['notification', name, args]) },
    };

    build.destroy();
    assert.deepEqual(calls[0], ['new-file', 'new-file']);
    for (const name of ['style', 'view', 'logic', 'translation', 'component-translation']) {
        assert.ok(calls.some(call => call[0] === 'events' && call[1] === name));
        assert.ok(calls.some(call => call[0] === 'delete' && call[1] === name && call[2] === `delete-${name}`));
    }
    assert.deepEqual(calls.at(-1), [
        'notification', 'aventus/unregisterBuild',
        [{ pathConfig: 'D:/app/aventus.conf.avt', buildName: 'Demo@web' }],
    ]);
});

test('IDE build gate follows settings while CLI build gate follows explicit enablement', () => {
    const build = Object.create(Build.prototype);
    build._allowBuild = true;
    SettingsManager.instance = { settings: { ideBuild: false } };
    GenericServer.instance = { isIDE: true };
    assert.equal(build.isBuildAllowed, false);
    SettingsManager.instance.settings.ideBuild = true;
    assert.equal(build.isBuildAllowed, true);
    build.disableBuild();
    assert.equal(build.isBuildAllowed, false);
    GenericServer.instance.isIDE = false;
    build.enableBuild();
    assert.equal(build.isBuildAllowed, true);
});

test('scheduled compilation currently still runs after build destruction', async t => {
    const calls = [];
    const build = Object.create(Build.prototype);
    build.initDone = true;
    build._build = async () => calls.push('compiled');
    build.onNewFileUUID = 'new-file';
    build.onFileDeleteUUIDs = {};
    build.scssFiles = {};
    build.htmlFiles = {};
    build.tsFiles = {};
    build.tsLanguageService = { i18nFiles: {} };
    build.i18nComponentsFiles = {};
    build.project = { getConfigFile: () => ({ path: 'D:/app/aventus.conf.avt' }) };
    build.buildConfig = { fullname: 'Demo@web' };
    FilesManager.instance = { removeOnNewFile: () => calls.push('unregistered') };
    GenericServer.instance = {
        isIDE: false, _noBuild: false, logLevel: 4,
        connection: {
            delayBetweenBuild: () => 15,
            sendNotification: () => calls.push('announced'),
        },
    };
    t.after(() => clearTimeout(build.timerBuild));

    await build.build();
    build.destroy();
    await new Promise(resolve => setTimeout(resolve, 40));
    assert.deepEqual(calls, ['unregistered', 'announced', 'compiled']);
});
