import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { FilesManager }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'files/FilesManager.ts',
]);

test('destroying a build leaves an already scheduled compilation running', async t => {
    const previousServer = GenericServer.instance;
    const previousFiles = FilesManager.instance;
    const notifications = [];
    GenericServer.instance = {
        _noBuild: false, logLevel: 99,
        connection: {
            delayBetweenBuild: () => 25,
            sendNotification: (name, args) => notifications.push([name, args]),
        },
    };
    FilesManager.instance = { removeOnNewFile() {} };
    const build = Object.create(Build.prototype);
    Object.assign(build, {
        initDone: true,
        project: { getConfigFile: () => ({ path: '/project/aventus.conf.avt' }) },
        buildConfig: { fullname: 'Demo@pending' },
        scssFiles: {}, htmlFiles: {}, tsFiles: {},
        tsLanguageService: { i18nFiles: {} }, i18nComponentsFiles: {},
    });
    let compilations = 0;
    build._build = async () => { compilations++; };
    t.after(() => {
        clearTimeout(build.timerBuild);
        GenericServer.instance = previousServer;
        FilesManager.instance = previousFiles;
    });

    await build.build();
    assert.equal(compilations, 0);
    build.destroy();
    await new Promise(resolve => setTimeout(resolve, 70));
    assert.equal(compilations, 1);
    assert.ok(notifications.some(([name]) => name === 'aventus/unregisterBuild'));
});
