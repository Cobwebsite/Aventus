import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ FilesManager }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'tools.ts',
]);

test('disk echo is suppressed until exactly two seconds after the last suppression request', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const dir = mkdtempSync(join(process.cwd(), 'aventus-update-deadline-'));
    const path = join(dir, 'sample.wcl.avt');
    const uri = pathToUri(path);
    const manager = Object.create(FilesManager.prototype);
    manager.pendingRegistrations = new Map();
    manager.files = { [uri]: { versionUser: 1 } };
    manager.lockedUpdatedUri = {};
    const events = [];
    manager.onContentChange = async document => events.push(['change', document.version, document.getText()]);
    manager.onSave = async document => events.push(['save', document.version]);
    try {
        writeFileSync(path, 'changed on disk');
        manager.preventUpdateUri(uri);
        t.mock.timers.tick(1_000);
        manager.preventUpdateUri(uri);
        t.mock.timers.tick(1_999);
        await manager.onUpdatedUri(uri);
        assert.deepEqual(events, []);
        assert.ok(manager.lockedUpdatedUri[uri]);

        t.mock.timers.tick(1);
        assert.equal(manager.lockedUpdatedUri[uri], undefined);
        await manager.onUpdatedUri(uri);
        assert.deepEqual(events, [['change', 2, 'changed on disk'], ['save', 2]]);
    } finally {
        for (const timeout of Object.values(manager.lockedUpdatedUri)) clearTimeout(timeout);
        t.mock.timers.reset();
        rmSync(dir, { recursive: true, force: true });
    }
});
