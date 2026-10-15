import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static export tracks outputs across additions and removals of destinations', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-destinations-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const first = join(root, 'first');
    const second = join(root, 'second');
    mkdirSync(input);
    const source = join(input, 'asset.bin');
    writeFileSync(source, Buffer.from([1, 2]));

    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    const oldHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const config = {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: [first.replace(/\\/g, '/')],
    };
    const exporter = new Static({ scssFiles: {} }, config);
    t.after(() => {
        exporter.destroy();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        HttpServer.getInstance = oldHttp;
    });

    const firstCopy = join(first, 'asset.bin');
    const secondCopy = join(second, 'asset.bin');
    await exporter.export();
    assert.deepEqual(readFileSync(firstCopy), Buffer.from([1, 2]));

    config.outputPathFolder.push(second.replace(/\\/g, '/'));
    writeFileSync(source, Buffer.from([3, 4, 5]));
    await exporter.export();
    assert.deepEqual(readFileSync(firstCopy), Buffer.from([3, 4, 5]));
    assert.deepEqual(readFileSync(secondCopy), Buffer.from([3, 4, 5]));

    config.outputPathFolder.shift();
    writeFileSync(source, Buffer.from([6]));
    await exporter.export();
    assert.deepEqual(readFileSync(firstCopy), Buffer.from([3, 4, 5]));
    assert.deepEqual(readFileSync(secondCopy), Buffer.from([6]));

    rmSync(source);
    await exporter.export();
    assert.equal(existsSync(firstCopy), false);
    assert.equal(existsSync(secondCopy), false);
    assert.equal(exporter.exportedBySource.size, 0);
    assert.equal(reloads, 4);
});
