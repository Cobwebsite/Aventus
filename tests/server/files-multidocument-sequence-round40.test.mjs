import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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
    assert.fail('expected asynchronous file event did not arrive');
}

test('interleaved document changes keep callbacks, versions, and diagnostics scoped to each URI', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-multidoc-'));
    const aPath = join(root, 'a.wcl.avt');
    const bPath = join(root, 'b.wcl.avt');
    const aUri = pathToUri(aPath);
    const bUri = pathToUri(bPath);
    const current = manager();
    const previous = [GenericServer.instance, SettingsManager.instance, FilesWatcher.instance];
    const changes = [];
    const saves = [];
    const deletions = [];
    const diagnostics = [];
    let releaseA;
    const aGate = new Promise(resolve => { releaseA = resolve; });
    const document = (uri, version, content) => TextDocument.create(uri, 'typescript', version, content);
    GenericServer.instance = { logLevel: 99, isIDE: true, connection: { sendDiagnostics: params => diagnostics.push(params) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    FilesWatcher.instance = { unwatch() {} };
    current.onNewFile(async file => {
        file.onContentChange(async changed => {
            changes.push([changed.uri, changed.versionUser, changed.contentUser]);
            if (changed.uri === aUri && changed.versionUser === 2) await aGate;
        });
        file.onSave(async saved => saves.push([saved.uri, saved.versionUser, saved.contentUser]));
        file.onDelete(async deleted => deletions.push(deleted.uri));
        file.onValidate(async observed => [{
            message: `${observed.versionUser}:${observed.contentUser}`,
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
        }]);
    });
    try {
        writeFileSync(aPath, 'disk a');
        await current.registerFile(document(aUri, 1, 'initial a'));
        await current.registerFile(document(bUri, 1, 'initial b'));
        const a = current.getByUri(aUri);
        const b = current.getByUri(bUri);

        const aSecond = current.onContentChange(document(aUri, 2, 'second a'));
        await until(() => changes.some(([uri, version]) => uri === aUri && version === 2));
        const aThird = current.onContentChange(document(aUri, 3, 'final a'));
        await current.onContentChange(document(bUri, 2, 'second b'));
        await current.onSave(document(bUri, 2, 'second b'));
        assert.deepEqual(saves, [[bUri, 2, 'second b']]);
        assert.equal(current.getByUri(bUri), b);
        assert.equal(b.contentUser, 'second b');
        releaseA();
        await Promise.all([aSecond, aThird]);
        await until(() => a.versionUser === 3);
        assert.equal(current.getByUri(aUri), a);
        assert.deepEqual(changes, [[aUri, 2, 'second a'], [bUri, 2, 'second b'], [aUri, 3, 'final a']]);

        await current.onClose(document(bUri, 2, 'second b'));
        await until(() => current.getByUri(bUri) === undefined);
        assert.deepEqual(deletions, [bUri]);
        assert.deepEqual(diagnostics.filter(item => item.uri === bUri), [{ uri: bUri, diagnostics: [] }]);
        assert.equal(current.getByUri(aUri), a);

        await until(() => diagnostics.some(item => item.uri === aUri));
        assert.deepEqual(diagnostics.filter(item => item.uri === aUri).map(item => item.diagnostics[0].message), ['3:final a']);
        assert.equal(a.versionUser, 3);
    } finally {
        releaseA();
        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        [GenericServer.instance, SettingsManager.instance, FilesWatcher.instance] = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
