import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { SettingsManager }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'settings/Settings.ts', 'tools.ts',
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

test('workspace readDirs accepts a specific config path while excluding its siblings', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-readdir-file-'));
    const previous = SettingsManager.instance;
    SettingsManager.instance = { settings: { readDirs: ['src/aventus.conf.avt'] } };
    try {
        mkdirSync(join(root, 'src'));
        mkdirSync(join(root, 'other'));
        const selected = join(root, 'src', 'aventus.conf.avt');
        writeFileSync(selected, '{"module":"Selected"}');
        writeFileSync(join(root, 'other', 'aventus.conf.avt'), '{"module":"Other"}');
        const found = await manager().loadAllAventusConfigFiles([pathToUri(root)]);
        assert.deepEqual(found.map(file => [file.uri, file.contentUser]), [
            [pathToUri(selected), '{"module":"Selected"}'],
        ]);
    } finally {
        SettingsManager.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});

test('a second server write extends suppression of its matching filesystem update only', async () => {
    const current = manager();
    const first = 'file:///d%3A/project/first.wcl.avt';
    const second = 'file:///d%3A/project/second.wcl.avt';
    const seen = [];
    current.onContentChange = async document => seen.push(document.uri);
    current.onSave = async document => seen.push(`save:${document.uri}`);
    const root = mkdtempSync(join(tmpdir(), 'aventus-suppress-'));
    const other = join(root, 'second.wcl.avt');
    writeFileSync(other, 'class Second {}');
    const otherUri = pathToUri(other);
    try {
        current.preventUpdateUri(first);
        const originalTimer = current.lockedUpdatedUri[first];
        current.preventUpdateUri(first);
        assert.notEqual(current.lockedUpdatedUri[first], originalTimer);
        assert.equal(current.lockedUpdatedUri[second], undefined);
        await current.onUpdatedUri(first);
        assert.deepEqual(seen, []);
        current.files[otherUri] = { versionUser: 1 };
        await current.onUpdatedUri(otherUri);
        assert.deepEqual(seen, [otherUri, `save:${otherUri}`]);
    } finally {
        clearTimeout(current.lockedUpdatedUri[first]);
        rmSync(root, { recursive: true, force: true });
    }
});
