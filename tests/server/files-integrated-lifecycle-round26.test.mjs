import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { GenericServer }, { SettingsManager }, { FilesWatcher }, { InitStep }, { pathToUri }, { ProjectManager }, { Statistics }] = await loadServerModules([
    'files/FilesManager.ts', 'GenericServer.ts', 'settings/Settings.ts',
    'files/FilesWatcher.ts', 'notification/InitStep.ts', 'tools.ts',
    'project/ProjectManager.ts', 'notification/Statistics.ts',
]);

function manager() {
    const instance = Object.create(FilesManager.prototype);
    Object.assign(instance, {
        files: {}, lockedUpdatedUri: {}, loadingInProgress: false,
        onNewFileCb: {}, onFileRemoveCb: {},
    });
    return instance;
}

test('workspace scan, disk refresh and shutdown preserve the file cache lifecycle', async () => {
    const root = mkdtempSync(join(process.cwd(), 'aventus-integrated-files-'));
    const src = join(root, 'src');
    const ignored = join(root, 'ignored');
    const dependencies = join(src, 'node_modules');
    for (const dir of [src, ignored, dependencies]) mkdirSync(dir, { recursive: true });
    const logic = join(src, 'entry.wcl.avt');
    const style = join(src, 'entry.wcs.avt');
    const config = join(src, 'aventus.conf.avt');
    writeFileSync(logic, 'class Entry {}');
    writeFileSync(style, ':host { color: red; }');
    writeFileSync(config, '{}');
    writeFileSync(join(ignored, 'other.wcl.avt'), 'class Other {}');
    writeFileSync(join(dependencies, 'dependency.wcl.avt'), 'class Dependency {}');

    const previous = [GenericServer.instance, SettingsManager.instance, FilesWatcher.instance, InitStep.send, InitStep.sendDone];
    const events = [];
    GenericServer.instance = { isIDE: false, logLevel: 99, connection: { sendDiagnostics() {} } };
    SettingsManager.instance = { settings: { readDirs: ['src'], errorByBuild: false } };
    FilesWatcher.instance = {
        watch: uri => events.push(['watch', uri]),
        unwatch: uri => events.push(['unwatch', uri]),
    };
    InitStep.send = message => events.push(['progress', message]);
    InitStep.sendDone = () => events.push(['done']);
    const current = manager();
    current.onNewFile(async file => {
        events.push(['new', file.uri, file.contentUser]);
        file.onContentChange(async changed => events.push(['change', changed.uri, changed.contentUser]));
        file.onSave(async saved => events.push(['save', saved.uri, saved.contentUser]));
        file.onDelete(async deleted => events.push(['delete', deleted.uri]));
    });
    try {
        await current.loadAllAventusFiles([pathToUri(root)]);
        const logicUri = pathToUri(logic);
        const styleUri = pathToUri(style);
        const configUri = pathToUri(config);
        assert.deepEqual(current.getUris().sort(), [logicUri, styleUri, configUri].sort());
        assert.deepEqual(events.filter(event => event[0] === 'new').map(event => event[1]), [logicUri, styleUri, configUri]);
        assert.deepEqual(events.filter(event => event[0] === 'watch').map(event => event[1]), [logicUri, styleUri, configUri]);
        assert.equal(events.findIndex(event => event[0] === 'new' && event[1] === configUri) > events.findIndex(event => event[0] === 'new' && event[1] === styleUri), true);
        assert.equal(events.at(-1)[0], 'done');
        assert.equal(current.loadingInProgress, false);

        const cached = current.getByUri(logicUri);
        writeFileSync(logic, 'class EntryUpdated {}');
        await current.onUpdatedUri(logicUri);
        assert.equal(current.getByUri(logicUri), cached);
        assert.equal(cached.contentUser, 'class EntryUpdated {}');
        assert.equal(cached.versionUser, 1);
        assert.deepEqual(events.filter(event => ['change', 'save'].includes(event[0])), [
            ['change', logicUri, 'class EntryUpdated {}'],
            ['save', logicUri, 'class EntryUpdated {}'],
        ]);

        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        await current.onShutdown();
        assert.deepEqual(current.getUris(), []);
        assert.deepEqual(events.filter(event => event[0] === 'delete').map(event => event[1]), [logicUri, styleUri, configUri]);
        assert.deepEqual(events.filter(event => event[0] === 'unwatch').map(event => event[1]), [logicUri, styleUri, configUri]);
    } finally {
        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        [GenericServer.instance, SettingsManager.instance, FilesWatcher.instance, InitStep.send, InitStep.sendDone] = previous;
        rmSync(root, { recursive: true, force: true });
    }
});

test('explicit CLI configuration loads only the selected build and static source trees', async () => {
    const root = mkdtempSync(join(process.cwd(), 'aventus-selected-config-'));
    const buildA = join(root, 'build-a');
    const buildB = join(root, 'build-b');
    const staticA = join(root, 'static-a');
    const staticB = join(root, 'static-b');
    for (const dir of [buildA, buildB, staticA, staticB, join(buildA, 'node_modules')]) mkdirSync(dir, { recursive: true });
    const config = join(root, 'aventus.conf.avt');
    const selectedBuild = join(buildA, 'selected.wcl.avt');
    const selectedStatic = join(staticB, 'selected.static.avt');
    writeFileSync(config, '{}');
    writeFileSync(selectedBuild, 'class Selected {}');
    writeFileSync(join(buildA, 'node_modules', 'hidden.wcl.avt'), 'class Hidden {}');
    writeFileSync(join(buildB, 'other.wcl.avt'), 'class Other {}');
    writeFileSync(join(staticA, 'other.static.avt'), 'other');
    writeFileSync(selectedStatic, 'selected');
    writeFileSync(join(staticB, 'notes.txt'), 'ignored');

    const previous = [ProjectManager.autoLoad, ProjectManager.getInstance, Statistics.startSendLoadFile, Statistics.sendLoadFile, InitStep.sendDone];
    const events = [];
    const project = {
        loadConfig: async () => events.push('load-config'),
        getConfig: () => ({
            build: [{ name: 'A', srcPath: [buildA] }, { name: 'B', srcPath: [buildB] }],
            static: [{ name: 'SA', inputPathFolder: staticA }, { name: 'SB', inputPathFolder: staticB }],
        }),
        loadFiles: () => events.push('load-files'),
        init: async () => events.push('init'),
    };
    ProjectManager.getInstance = () => ({ getProjectByUri: uri => {
        assert.equal(uri, pathToUri(config));
        return project;
    } });
    Statistics.startSendLoadFile = () => events.push('statistics-start');
    Statistics.sendLoadFile = () => events.push('statistics-end');
    InitStep.sendDone = () => events.push('done');
    const current = manager();
    current.registerFile = async document => {
        events.push(['file', document.uri, document.getText()]);
        return document;
    };
    try {
        await current.loadConfigFile(pathToUri(config), ['A'], ['SB']);
        assert.equal(ProjectManager.autoLoad, false);
        assert.deepEqual(project.buildsAllowed, ['A']);
        assert.deepEqual(project.staticsAllowed, ['SB']);
        assert.deepEqual(events, [
            ['file', pathToUri(config), '{}'],
            'load-config',
            ['file', pathToUri(selectedBuild), 'class Selected {}'],
            ['file', pathToUri(selectedStatic), 'selected'],
            'statistics-start', 'load-files', 'statistics-end', 'init', 'done',
        ]);
        assert.equal(current.loadingInProgress, false);
    } finally {
        [ProjectManager.autoLoad, ProjectManager.getInstance, Statistics.startSendLoadFile, Statistics.sendLoadFile, InitStep.sendDone] = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
