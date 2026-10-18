import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { FilesManager }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'files/FilesManager.ts',
]);

test('destroy removes every registered file listener once, including i18n files', t => {
    const oldServer = GenericServer.instance;
    const oldFiles = FilesManager.instance;
    const calls = [];
    GenericServer.instance = {
        logLevel: 0,
        connection: { sendNotification: (name, args) => calls.push(['notification', name, args]) },
    };
    FilesManager.instance = { removeOnNewFile: uuid => calls.push(['new-file', uuid]) };
    t.after(() => {
        GenericServer.instance = oldServer;
        FilesManager.instance = oldFiles;
    });

    const listeners = {};
    const fileCategory = (category, uri) => {
        const listener = {
            removeEvents: () => calls.push(['events', category, uri]),
            file: { removeOnDelete: uuid => calls.push(['delete', uri, uuid]) },
        };
        listeners[uri] = `delete-${category}`;
        return { [uri]: listener };
    };
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    Object.assign(build, {
        project: { getConfigFile: () => ({ path: '/project/aventus.conf.avt' }) },
        buildConfig: { fullname: 'Demo@main' },
        onNewFileUUID: 'new-file-listener',
        scssFiles: fileCategory('scss', 'file:///a.scss'),
        htmlFiles: fileCategory('html', 'file:///b.html'),
        tsFiles: fileCategory('ts', 'file:///c.ts'),
        tsLanguageService: { i18nFiles: fileCategory('i18n', 'file:///d.i18n') },
        i18nComponentsFiles: fileCategory('i18n-component', 'file:///e.i18n'),
        onFileDeleteUUIDs: listeners,
    });

    build.destroy();
    build.destroy();

    assert.deepEqual(calls.filter(call => call[0] === 'new-file'), [['new-file', 'new-file-listener']]);
    for (const [category, uri] of [
        ['scss', 'file:///a.scss'], ['html', 'file:///b.html'], ['ts', 'file:///c.ts'],
        ['i18n', 'file:///d.i18n'], ['i18n-component', 'file:///e.i18n'],
    ]) {
        assert.deepEqual(calls.filter(call => call.at(-1) === uri || call[1] === uri), [
            ['events', category, uri], ['delete', uri, `delete-${category}`],
        ]);
    }
    assert.equal(calls.filter(call => call[0] === 'notification').length, 1);
    assert.equal(build.destroyed, true);
});
