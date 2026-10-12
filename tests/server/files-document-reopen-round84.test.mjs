import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { GenericServer }, { FilesWatcher }, { SettingsManager }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'GenericServer.ts', 'files/FilesWatcher.ts', 'settings/Settings.ts', 'tools.ts',
]);

test('an edited and saved document is discarded on close after disk removal, then reopens as a fresh file', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-reopen-'));
    const path = join(root, 'entry.wcl.avt');
    const uri = pathToUri(path);
    const previous = [GenericServer.instance, FilesWatcher.instance, SettingsManager.instance];
    const manager = Object.create(FilesManager.prototype);
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    const events = [];
    GenericServer.instance = { isIDE: true, logLevel: 99, connection: { sendDiagnostics: params => events.push(['diagnostics', params.uri, params.diagnostics]) } };
    FilesWatcher.instance = { unwatch: value => events.push(['unwatch', value]) };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    manager.onNewFile(async file => {
        events.push(['new', file.contentUser]);
        file.onContentChange(async changed => events.push(['change', changed.versionUser, changed.contentUser]));
        file.onSave(async saved => events.push(['save', saved.versionUser, saved.contentUser]));
        file.onDelete(async deleted => events.push(['delete', deleted.contentUser]));
    });
    const doc = (version, content) => TextDocument.create(uri, 'typescript', version, content);
    const until = async predicate => {
        for (let attempt = 0; attempt < 100; attempt++) {
            if (predicate()) return;
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        assert.fail('close did not remove the file');
    };
    try {
        writeFileSync(path, 'disk first');
        await manager.registerFile(doc(1, 'opened first'));
        const first = manager.getByUri(uri);
        await manager.onContentChange(doc(2, 'edited first'));
        await manager.onSave(doc(2, 'edited first'));
        assert.equal(first.contentUser, 'edited first');
        assert.equal(first.versionUser, 2);

        unlinkSync(path);
        await manager.onClose(doc(2, 'edited first'));
        await until(() => manager.getByUri(uri) === undefined);
        assert.equal(manager.getByUri(uri), undefined);
        writeFileSync(path, 'disk second');
        await manager.registerFile(doc(7, 'opened second'));
        const second = manager.getByUri(uri);
        assert.notEqual(second, first);
        assert.equal(second.contentUser, 'opened second');
        assert.equal(second.versionUser, 7);
        assert.deepEqual(events, [
            ['new', 'opened first'], ['change', 2, 'edited first'], ['save', 2, 'edited first'],
            ['diagnostics', uri, []], ['delete', 'edited first'], ['unwatch', uri],
            ['new', 'opened second'],
        ]);
    } finally {
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        [GenericServer.instance, FilesWatcher.instance, SettingsManager.instance] = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
