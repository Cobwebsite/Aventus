import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('removing a static source preserves a destination edited outside the exporter', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-edited-output-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'untouched'), join(root, 'edited')];
    mkdirSync(join(input, 'assets'), { recursive: true });
    const source = join(input, 'assets', 'logo.bin');
    writeFileSync(source, Buffer.from([0, 1, 2]));

    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    const oldHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const target = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: outputs.map(path => path.replace(/\\/g, '/')),
    });
    t.after(() => {
        target.destroy();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        HttpServer.getInstance = oldHttp;
    });

    const exported = outputs.map(output => join(output, 'assets', 'logo.bin'));
    await target.export();
    for (const path of exported) assert.deepEqual(readFileSync(path), Buffer.from([0, 1, 2]));

    writeFileSync(exported[1], Buffer.from([9, 8, 7, 6]));
    unlinkSync(source);
    await target.export();
    assert.equal(existsSync(exported[0]), false);
    assert.deepEqual(readFileSync(exported[1]), Buffer.from([9, 8, 7, 6]));
    assert.equal(reloads, 2);
});
