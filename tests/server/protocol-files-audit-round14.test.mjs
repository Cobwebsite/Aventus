import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { InternalAventusFile }, { GenericServer }, { FilesWatcher }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'files/AventusFile.ts', 'GenericServer.ts', 'files/FilesWatcher.ts', 'tools.ts',
]);

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

test('disk creation waits for its asynchronous save callback', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-create-save-'));
    const path = join(root, 'sample.wcl.avt');
    writeFileSync(path, 'class Sample {}');
    const uri = pathToUri(path);
    const manager = Object.create(FilesManager.prototype);
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    const previousServer = GenericServer.instance;
    const previousWatcher = FilesWatcher.instance;
    const gate = deferred();
    const started = deferred();
    const events = [];
    GenericServer.instance = { isIDE: false, logLevel: 99 };
    FilesWatcher.instance = { watch: () => {} };
    manager.onNewFile(async file => {
        file.onSave(async () => {
            events.push('save-started');
            started.resolve();
            await gate.promise;
            events.push('save-finished');
        });
    });
    try {
        let finished = false;
        const creation = manager.onCreatedUri(uri).then(() => { finished = true; });
        await started.promise;
        assert.deepEqual(events, ['save-started']);
        assert.equal(finished, false);
        assert.equal(manager.getByUri(uri).contentUser, 'class Sample {}');
        gate.resolve();
        await creation;
        assert.deepEqual(events, ['save-started', 'save-finished']);
    } finally {
        gate.resolve();
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        FilesWatcher.instance = previousWatcher;
        rmSync(root, { recursive: true, force: true });
    }
});

test('disk updates wait for save when registering and refreshing a file', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-update-save-'));
    const path = join(root, 'sample.wcl.avt');
    const uri = pathToUri(path);
    const manager = Object.create(FilesManager.prototype);
    manager.files = {};
    manager.lockedUpdatedUri = {};
    const saves = [];
    manager.registerFile = async document => {
        manager.files[uri] = { versionUser: document.version };
    };
    manager.onContentChange = async document => {
        manager.files[uri].versionUser = document.version;
    };
    manager.onSave = async () => {
        const gate = deferred();
        saves.push(gate);
        await gate.promise;
    };
    try {
        writeFileSync(path, 'first');
        let firstFinished = false;
        const first = manager.onUpdatedUri(uri).then(() => { firstFinished = true; });
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(saves.length, 1);
        assert.equal(firstFinished, false);
        saves[0].resolve();
        await first;

        writeFileSync(path, 'second');
        let secondFinished = false;
        const second = manager.onUpdatedUri(uri).then(() => { secondFinished = true; });
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(saves.length, 2);
        assert.equal(secondFinished, false);
        saves[1].resolve();
        await second;
    } finally {
        for (const save of saves) save.resolve();
        rmSync(root, { recursive: true, force: true });
    }
});

test('deleted file clears validation, navigation, build and content callbacks', async () => {
    const uri = 'file:///round14-removed.wcl.avt';
    const file = new InternalAventusFile(TextDocument.create(uri, 'typescript', 1, 'first'));
    const previousServer = GenericServer.instance;
    const seen = [];
    file.onValidate(async () => { seen.push('validate'); return []; });
    file.onReferences(async () => { seen.push('references'); return []; });
    file.onCodeLens(async () => { seen.push('lens'); return []; });
    file.onRename(async () => { seen.push('rename'); return null; });
    file.onCanContentChange(() => { seen.push('guard'); return false; });
    file.onGetBuild(() => { seen.push('build'); return null; });
    GenericServer.instance = { connection: { sendDiagnostics: () => {} } };
    try {
        await file.triggerDelete();
        await file.validate(false);
        await file.getReferences({ line: 0, character: 0 });
        await file.getCodeLens();
        await file.getRename({ line: 0, character: 0 }, 'new');
        await file.triggerContentChange(TextDocument.create(uri, 'typescript', 2, 'second'));
        assert.deepEqual(seen, []);
        assert.deepEqual(file.getBuild(), []);
        assert.equal(file.contentUser, 'first');
    } finally {
        clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
    }
});
