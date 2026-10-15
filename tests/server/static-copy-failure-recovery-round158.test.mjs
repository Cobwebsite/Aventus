import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static binary copy failure retains other exports and retries on the same instance', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-copy-retry-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const blocked = join(root, 'blocked');
    const available = join(root, 'available');
    mkdirSync(input);
    const source = join(input, 'logo.bin');
    writeFileSync(source, Buffer.from([4, 5, 6]));
    writeFileSync(blocked, 'a file prevents creation of this output directory');

    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    const oldError = GenericServer.error;
    const oldHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    const errors = [];
    GenericServer.error = error => errors.push(error);
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const target = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: [blocked.replace(/\\/g, '/'), available.replace(/\\/g, '/')],
    });
    t.after(() => {
        target.destroy();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        GenericServer.error = oldError;
        HttpServer.getInstance = oldHttp;
    });

    await target.export();
    assert.deepEqual(readFileSync(join(available, 'logo.bin')), Buffer.from([4, 5, 6]));
    assert.equal(reloads, 0);
    assert.equal(errors.length, 1);

    rmSync(blocked);
    await target.export();
    assert.deepEqual(readFileSync(join(blocked, 'logo.bin')), Buffer.from([4, 5, 6]));
    assert.deepEqual(readFileSync(join(available, 'logo.bin')), Buffer.from([4, 5, 6]));
    assert.equal(reloads, 1);

    rmSync(source);
    await target.export();
    assert.equal(existsSync(join(blocked, 'logo.bin')), false);
    assert.equal(existsSync(join(available, 'logo.bin')), false);
});
