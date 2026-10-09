import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { SettingsManager }, { GenericServer }, { FilesWatcher }, tools, { InternalAventusFile }] = await loadServerModules([
    'files/FilesManager.ts', 'settings/Settings.ts', 'GenericServer.ts', 'files/FilesWatcher.ts', 'tools.ts', 'files/AventusFile.ts',
]);

function manager() {
    const instance = Object.create(FilesManager.prototype);
    instance.files = {};
    instance.lockedUpdatedUri = {};
    instance.loadingInProgress = false;
    instance.onNewFileCb = {};
    instance.onFileRemoveCb = {};
    return instance;
}

test('workspace discovery finds config in multiple roots and skips node_modules and .git', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-files-'));
    const oldSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { readDirs: [] } };
    try {
        const a = join(root, 'a');
        const b = join(root, 'b');
        for (const dir of [a, b, join(a, 'src'), join(a, 'node_modules'), join(b, '.git')]) mkdirSync(dir, { recursive: true });
        writeFileSync(join(a, 'aventus.conf.avt'), '{"module":"A"}');
        writeFileSync(join(b, 'aventus.conf.avt'), '{"module":"B"}');
        writeFileSync(join(a, 'src', 'other.wcl.avt'), 'class Other {}');
        writeFileSync(join(a, 'node_modules', 'aventus.conf.avt'), '{}');
        writeFileSync(join(b, '.git', 'aventus.conf.avt'), '{}');
        const found = await manager().loadAllAventusConfigFiles([tools.pathToUri(a), tools.pathToUri(b)]);
        assert.deepEqual(found.map(file => file.contentUser).sort(), ['{"module":"A"}', '{"module":"B"}']);
        assert.deepEqual(found.map(file => file.name), ['aventus.conf.avt', 'aventus.conf.avt']);
    } finally {
        SettingsManager.instance = oldSettings;
        rmSync(root, { recursive: true, force: true });
    }
});

test('workspace discovery respects readDirs and ignores a sibling directory', async () => {
    const root = mkdtempSync(join(process.cwd(), 'aventus-readdirs-'));
    const oldSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { readDirs: ['src'] } };
    try {
        mkdirSync(join(root, 'src'), { recursive: true });
        mkdirSync(join(root, 'other'), { recursive: true });
        writeFileSync(join(root, 'src', 'aventus.conf.avt'), '{"module":"Included"}');
        writeFileSync(join(root, 'other', 'aventus.conf.avt'), '{"module":"Excluded"}');
        const found = await manager().loadAllAventusConfigFiles([tools.pathToUri(root)]);
        assert.deepEqual(found.map(file => file.contentUser), ['{"module":"Included"}']);
    } finally {
        SettingsManager.instance = oldSettings;
        rmSync(root, { recursive: true, force: true });
    }
});

test('filesystem create notification ignores an unknown extension', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-unknown-'));
    const path = join(root, 'readme.txt');
    try {
        writeFileSync(path, 'not Aventus');
        const instance = manager();
        await instance.onCreatedUri(tools.pathToUri(path));
        assert.deepEqual(instance.getUris(), []);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('file manager routes all LSP operations and returns neutral values for missing files', async () => {
    const instance = manager();
    const document = TextDocument.create('file:///missing.wcl.avt', 'typescript', 1, 'x');
    const position = { line: 0, character: 0 };
    const range = { start: position, end: position };
    const options = { tabSize: 4, insertSpaces: true };
    assert.deepEqual(await instance.onCompletion(document, position), { isIncomplete: false, items: [] });
    assert.deepEqual(await instance.onCompletionResolve(document, { label: 'x' }), { label: 'x' });
    assert.equal(await instance.onHover(document, position), null);
    assert.equal(await instance.onDefinition(document, position), null);
    assert.deepEqual(await instance.onFormatting(document, options), []);
    assert.deepEqual(await instance.onCodeAction(document, range), []);
    assert.deepEqual(await instance.onReferences(document, position), []);
    assert.deepEqual(await instance.onCodeLens(document), []);
    assert.equal(await instance.onRename(document, position, 'renamed'), null);
});

test('file manager caches create, change, save and delete events and clears diagnostics', async () => {
    const instance = manager();
    const events = [];
    const watched = [];
    const diagnostics = [];
    const oldServer = GenericServer.instance;
    const oldWatcher = FilesWatcher.instance;
    const oldSettings = SettingsManager.instance;
    GenericServer.instance = { isIDE: true, logLevel: 99, connection: { sendDiagnostics: (value, build) => diagnostics.push([value, build]) } };
    FilesWatcher.instance = { watch: uri => watched.push(['watch', uri]), unwatch: uri => watched.push(['unwatch', uri]) };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    const uri = 'file:///d%3A/app/test.wcl.avt';
    const first = TextDocument.create(uri, 'typescript', 1, 'old');
    const second = TextDocument.create(uri, 'typescript', 2, 'new');
    try {
        instance.onNewFile(async file => {
            events.push(['create', file.contentUser]);
            file.onContentChange(async changed => events.push(['change', changed.contentUser]));
            file.onSave(async changed => events.push(['save', changed.contentUser]));
            file.onDelete(async () => events.push(['delete']));
        });
        await instance.registerFile(first);
        assert.equal(instance.getByUri(uri).contentUser, 'old');
        await instance.onContentChange(second);
        await instance.onSave(second);
        clearTimeout(instance.getByUri(uri).delayValidate);
        await instance.onDeletedUri(uri);
        assert.equal(instance.getByUri(uri), undefined);
        assert.deepEqual(events, [['create', 'old'], ['change', 'new'], ['save', 'new'], ['delete']]);
        assert.deepEqual(diagnostics, [[{ uri, diagnostics: [] }, undefined]]);
        assert.deepEqual(watched, [['unwatch', uri]]);
    } finally {
        for (const file of Object.values(instance.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = oldServer;
        FilesWatcher.instance = oldWatcher;
        SettingsManager.instance = oldSettings;
    }
});

test('file manager prevents filesystem update echo until its suppression timer expires', async () => {
    const instance = manager();
    const uri = 'file:///d%3A/app/test.wcl.avt';
    instance.preventUpdateUri(uri);
    try {
        await instance.onUpdatedUri(uri);
        assert.equal(instance.getByUri(uri), undefined);
        assert.ok(instance.lockedUpdatedUri[uri]);
    } finally {
        clearTimeout(instance.lockedUpdatedUri[uri]);
        delete instance.lockedUpdatedUri[uri];
    }
});

test('rapid content changes publish only the latest delayed validation result', async () => {
    const uri = 'file:///d%3A/app/rapid.wcl.avt';
    const file = new InternalAventusFile(TextDocument.create(uri, 'typescript', 1, 'first'));
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    const diagnostics = [];
    GenericServer.instance = { logLevel: 99, connection: { sendDiagnostics: value => diagnostics.push(value) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    file.onValidate(async current => [{
        message: current.contentUser,
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
    }]);
    try {
        await file.triggerContentChange(TextDocument.create(uri, 'typescript', 2, 'second'));
        await file.triggerContentChange(TextDocument.create(uri, 'typescript', 3, 'third'));
        await new Promise(resolve => setTimeout(resolve, 600));
        assert.equal(file.contentUser, 'third');
        assert.deepEqual(diagnostics.map(value => value.diagnostics[0].message), ['third']);
    } finally {
        clearTimeout(file.delayValidate);
        GenericServer.instance = oldServer;
        SettingsManager.instance = oldSettings;
    }
});

test('file manager shutdown deletes cached files and unregisters every watched URI', async () => {
    const instance = manager();
    const removed = [];
    const oldWatcher = FilesWatcher.instance;
    FilesWatcher.instance = { unwatch: uri => removed.push(['unwatch', uri]) };
    instance.files = {
        'file:///a.wcl.avt': { triggerDelete: async () => removed.push(['delete', 'file:///a.wcl.avt']) },
        'file:///b.wcs.avt': { triggerDelete: async () => removed.push(['delete', 'file:///b.wcs.avt']) },
    };
    try {
        await instance.onShutdown();
        assert.deepEqual(instance.getUris(), []);
        assert.deepEqual(removed, [
            ['delete', 'file:///a.wcl.avt'], ['unwatch', 'file:///a.wcl.avt'],
            ['delete', 'file:///b.wcs.avt'], ['unwatch', 'file:///b.wcs.avt'],
        ]);
    } finally {
        FilesWatcher.instance = oldWatcher;
    }
});
