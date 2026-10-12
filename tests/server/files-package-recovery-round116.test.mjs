import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { GenericServer }, { FilesWatcher }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'GenericServer.ts', 'files/FilesWatcher.ts', 'tools.ts',
]);

test('an external package missing at registration refreshes the same cached file when it appears', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-package-recovery-'));
    const path = join(root, 'library.package.avt');
    const uri = pathToUri(path);
    const previousServer = GenericServer.instance;
    const previousWatcher = FilesWatcher.instance;
    const manager = Object.create(FilesManager.prototype);
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    const events = [];
    GenericServer.instance = { isIDE: true, logLevel: 99 };
    FilesWatcher.instance = { watch: value => events.push(['watch', value]) };
    manager.onNewFile(async file => {
        events.push(['new', file.contentUser]);
        file.onContentChange(async changed => events.push(['change', changed.contentUser]));
    });
    try {
        const missing = await manager.registerFilePackage(uri);
        assert.equal(missing.contentUser, '');
        writeFileSync(path, 'declare namespace Library { class Card {} }');
        const recovered = await manager.registerFilePackage(uri);
        assert.equal(recovered, missing);
        assert.equal(recovered.contentUser, 'declare namespace Library { class Card {} }');
        assert.deepEqual(events, [
            ['watch', uri], ['new', ''],
            ['watch', uri], ['change', 'declare namespace Library { class Card {} }'],
        ]);
    } finally {
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        FilesWatcher.instance = previousWatcher;
        rmSync(root, { recursive: true, force: true });
    }
});
