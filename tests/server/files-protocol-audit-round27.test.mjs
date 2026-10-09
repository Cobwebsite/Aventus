import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

test('saving an uncached document registers it, then a later save invokes its save callbacks', async () => {
    const current = manager();
    const uri = 'file:///round27-uncached.wcl.avt';
    const document = TextDocument.create(uri, 'typescript', 1, 'class Entry {}');
    const previousServer = GenericServer.instance;
    const previousWatcher = FilesWatcher.instance;
    const events = [];
    GenericServer.instance = { isIDE: false, logLevel: 99 };
    FilesWatcher.instance = { watch: value => events.push(['watch', value]) };
    current.onNewFile(async file => {
        events.push(['new', file.uri]);
        file.onSave(async saved => events.push(['save', saved.uri]));
    });
    try {
        await current.onSave(document);
        assert.equal(current.getByUri(uri).contentUser, 'class Entry {}');
        assert.deepEqual(events, [['new', uri]]);
        await current.onSave(document);
        assert.deepEqual(events, [['new', uri], ['save', uri]]);
    } finally {
        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        FilesWatcher.instance = previousWatcher;
    }
});

test('workspace discovery unions multiple readDirs while excluding sibling files and dependencies', async () => {
    const root = mkdtempSync(join(process.cwd(), 'aventus-round27-readdirs-'));
    const first = join(root, 'src');
    const second = join(root, 'shared');
    const excluded = join(root, 'other');
    for (const dir of [first, second, excluded, join(first, 'node_modules')]) mkdirSync(dir, { recursive: true });
    writeFileSync(join(first, 'aventus.conf.avt'), '{"module":"src"}');
    writeFileSync(join(second, 'aventus.conf.avt'), '{"module":"shared"}');
    writeFileSync(join(excluded, 'aventus.conf.avt'), '{"module":"other"}');
    writeFileSync(join(first, 'node_modules', 'aventus.conf.avt'), '{"module":"dependency"}');
    const previousSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { readDirs: ['src', 'shared'] } };
    try {
        const found = await manager().loadAllAventusConfigFiles([pathToUri(root)]);
        assert.deepEqual(found.map(file => file.contentUser).sort(), ['{"module":"shared"}', '{"module":"src"}']);
    } finally {
        SettingsManager.instance = previousSettings;
        rmSync(root, { recursive: true, force: true });
    }
});
