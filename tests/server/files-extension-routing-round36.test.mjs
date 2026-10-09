import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { GenericServer }, { SettingsManager }, { FilesWatcher }, { InitStep }, { pathToUri }, { AventusLanguageId }] = await loadServerModules([
    'files/FilesManager.ts', 'GenericServer.ts', 'settings/Settings.ts', 'files/FilesWatcher.ts',
    'notification/InitStep.ts', 'tools.ts', 'definition.ts',
]);

function manager() {
    const current = Object.create(FilesManager.prototype);
    Object.assign(current, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    return current;
}

test('workspace scan routes single components and packages; disk creation routes template scripts and deletion clears each cache entry', async () => {
    const root = mkdtempSync(join(process.cwd(), 'aventus-file-extensions-'));
    const paths = ['widget.wc.avt', 'vendor.package.avt', 'template.avt.ts'].map(name => join(root, name));
    const uris = paths.map(pathToUri);
    paths.forEach((path, index) => writeFileSync(path, ['class Widget {}', 'declare namespace Vendor {}', 'export default {}'][index]));
    const previous = [GenericServer.instance, SettingsManager.instance, FilesWatcher.instance, InitStep.send, InitStep.sendDone];
    const events = [];
    GenericServer.instance = { isIDE: false, logLevel: 99, connection: { sendDiagnostics() {} } };
    SettingsManager.instance = { settings: { readDirs: [], errorByBuild: false } };
    FilesWatcher.instance = { watch: uri => events.push(['watch', uri]), unwatch: uri => events.push(['unwatch', uri]) };
    InitStep.send = () => {};
    InitStep.sendDone = () => {};
    const current = manager();
    current.onNewFile(async file => {
        events.push(['new', file.uri, file.documentUser.languageId]);
        file.onDelete(async deleted => events.push(['delete', deleted.uri]));
    });
    try {
        await current.loadAllAventusFiles([pathToUri(root)]);
        assert.deepEqual(current.getUris().sort(), uris.slice(0, 2).sort());
        assert.deepEqual(events.filter(event => event[0] === 'new').map(event => event.slice(1)).sort((a, b) => a[0].localeCompare(b[0])), [
            [uris[0], AventusLanguageId.TypeScript], [uris[1], AventusLanguageId.TypeScript],
        ].sort((a, b) => a[0].localeCompare(b[0])));
        await current.onCreatedUri(uris[2]);
        assert.equal(current.getByUri(uris[2]).documentUser.languageId, AventusLanguageId.TypeScript);
        assert.deepEqual(events.filter(event => event[0] === 'watch').map(event => event[1]).sort(), uris.toSorted());

        for (const uri of uris) {
            unlinkSync(paths[uris.indexOf(uri)]);
            await current.onDeletedUri(uri);
            assert.equal(current.getByUri(uri), undefined);
        }
        assert.deepEqual(events.filter(event => event[0] === 'delete').map(event => event[1]), uris);
        assert.deepEqual(events.filter(event => event[0] === 'unwatch').map(event => event[1]), uris);
        assert.deepEqual(current.getUris(), []);
    } finally {
        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        [GenericServer.instance, SettingsManager.instance, FilesWatcher.instance, InitStep.send, InitStep.sendDone] = previous;
        rmSync(root, { recursive: true, force: true });
    }
});

test('template LSP access registers an uncached document, then deletion allows fresh registration', async () => {
    const root = mkdtempSync(join(process.cwd(), 'aventus-template-lsp-'));
    const uri = pathToUri(join(root, 'template.avt.ts'));
    const previous = [GenericServer.instance, SettingsManager.instance, FilesWatcher.instance];
    const events = [];
    GenericServer.instance = { isIDE: true, logLevel: 99, connection: { sendDiagnostics() {} } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    FilesWatcher.instance = { unwatch: value => events.push(['unwatch', value]) };
    const current = manager();
    current.onNewFile(async file => events.push(['new', file.contentUser]));
    try {
        const first = TextDocument.create(uri, AventusLanguageId.TypeScript, 1, 'export default 1');
        assert.equal(await current.fileExists(first), true);
        assert.equal(current.getByUri(uri).contentUser, 'export default 1');
        assert.equal(await current.fileExists(first), true);
        assert.deepEqual(events.filter(event => event[0] === 'new'), [['new', 'export default 1']]);
        await current.onDeletedUri(uri);
        const second = TextDocument.create(uri, AventusLanguageId.TypeScript, 2, 'export default 2');
        assert.equal(await current.fileExists(second), true);
        assert.equal(current.getByUri(uri).contentUser, 'export default 2');
        assert.deepEqual(events.filter(event => event[0] === 'new'), [['new', 'export default 1'], ['new', 'export default 2']]);
        assert.deepEqual(events.filter(event => event[0] === 'unwatch'), [['unwatch', uri]]);
    } finally {
        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        [GenericServer.instance, SettingsManager.instance, FilesWatcher.instance] = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
