import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { GenericServer }, { SettingsManager }, { FilesWatcher }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'GenericServer.ts', 'settings/Settings.ts', 'files/FilesWatcher.ts', 'tools.ts',
]);

function manager() {
    const instance = Object.create(FilesManager.prototype);
    Object.assign(instance, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    return instance;
}

async function until(predicate) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (predicate()) return;
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.fail('validation did not start');
}

test('deleting a file during delayed validation clears and then republishes its stale diagnostic', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-diagnostic-deletion-'));
    const path = join(root, 'entry.wcl.avt');
    const uri = pathToUri(path);
    const current = manager();
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    const previousWatcher = FilesWatcher.instance;
    const sent = [];
    let releaseValidation;
    const validationGate = new Promise(resolve => { releaseValidation = resolve; });
    let validating = false;
    GenericServer.instance = { logLevel: 99, isIDE: true, connection: { sendDiagnostics: params => sent.push(params) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    FilesWatcher.instance = { unwatch() {} };
    const doc = (version, content) => TextDocument.create(uri, 'typescript', version, content);
    try {
        writeFileSync(path, 'on disk');
        await current.registerFile(doc(1, 'first'));
        const file = current.getByUri(uri);
        file.onValidate(async () => {
            validating = true;
            await validationGate;
            return [{ message: 'stale', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } } }];
        });
        await current.onContentChange(doc(2, 'changed'));
        await until(() => validating);
        unlinkSync(path);
        await current.onDeletedUri(uri);
        assert.equal(current.getByUri(uri), undefined);
        assert.deepEqual(sent, [{ uri, diagnostics: [] }]);
        releaseValidation();
        await until(() => sent.length === 2);
        assert.equal(sent[1].diagnostics[0].message, 'stale');
    } finally {
        releaseValidation();
        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
        FilesWatcher.instance = previousWatcher;
        rmSync(root, { recursive: true, force: true });
    }
});

test('close and reopen same URI replaces divergent buffer and publishes diagnostics for reopened content', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-diagnostic-reopen-'));
    const path = join(root, 'entry.wcl.avt');
    const uri = pathToUri(path);
    const current = manager();
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    const sent = [];
    const validated = [];
    GenericServer.instance = { logLevel: 99, isIDE: true, connection: { sendDiagnostics: params => sent.push(params) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    current.onNewFile(async file => {
        file.onValidate(async observed => {
            validated.push(observed.contentUser);
            return [{ message: observed.contentUser, range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } } }];
        });
    });
    const doc = (version, content) => TextDocument.create(uri, 'typescript', version, content);
    try {
        writeFileSync(path, 'disk version');
        await current.registerFile(doc(1, 'first buffer'));
        const file = current.getByUri(uri);
        await current.onContentChange(doc(2, 'unsaved buffer'));
        await current.onClose(doc(2, 'unsaved buffer'));
        assert.equal(current.getByUri(uri), file);
        assert.equal(file.contentUser, 'unsaved buffer');
        assert.equal(readFileSync(path, 'utf8'), 'disk version');
        await current.registerFile(doc(3, 'reopened buffer'));
        assert.equal(current.getByUri(uri), file);
        assert.equal(file.contentUser, 'reopened buffer');
        assert.equal(file.versionUser, 3);
        await until(() => sent.length > 0);
        assert.deepEqual(validated, ['reopened buffer']);
        assert.equal(sent[0].diagnostics[0].message, 'reopened buffer');
    } finally {
        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
        rmSync(root, { recursive: true, force: true });
    }
});
