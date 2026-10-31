import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static export updates nested binary files and cleans removed nested sources', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-nested-rebuild-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const output = join(root, 'output');
    const first = join(input, 'icons', 'small', 'first.bin');
    const second = join(input, 'icons', 'small', 'second.bin');
    mkdirSync(join(input, 'icons', 'small'), { recursive: true });
    writeFileSync(first, Buffer.from([1, 2]));

    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    const oldHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const target = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: [output.replace(/\\/g, '/')],
    });
    t.after(() => {
        target.destroy();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        HttpServer.getInstance = oldHttp;
    });

    const outFirst = join(output, 'icons', 'small', 'first.bin');
    const outSecond = join(output, 'icons', 'small', 'second.bin');
    await target.export();
    assert.deepEqual(readFileSync(outFirst), Buffer.from([1, 2]));

    writeFileSync(first, Buffer.from([3, 4, 5]));
    writeFileSync(second, Buffer.from([6]));
    await target.export();
    assert.deepEqual(readFileSync(outFirst), Buffer.from([3, 4, 5]));
    assert.deepEqual(readFileSync(outSecond), Buffer.from([6]));

    rmSync(join(input, 'icons'), { recursive: true });
    await target.export();
    assert.equal(existsSync(outFirst), false);
    assert.equal(existsSync(outSecond), false);
    assert.equal(reloads, 3);
});
