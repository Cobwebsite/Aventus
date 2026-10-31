import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static export switches input folders with a colliding relative file and later removes the new source', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-input-switch-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const first = join(root, 'first');
    const second = join(root, 'second');
    const output = join(root, 'output');
    mkdirSync(first);
    mkdirSync(second);
    const firstSource = join(first, 'asset.bin');
    const secondSource = join(second, 'asset.bin');
    const copy = join(output, 'asset.bin');
    writeFileSync(firstSource, Buffer.from([1, 2]));
    writeFileSync(secondSource, Buffer.from([3, 4, 5, 6]));

    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    const oldHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 99, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const config = {
        name: 'assets', inputPathFolder: first.replaceAll('\\', '/'),
        outputPathFolder: [output.replaceAll('\\', '/')],
    };
    const exporter = new Static({ scssFiles: {} }, config);
    t.after(() => {
        exporter.destroy();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        HttpServer.getInstance = oldHttp;
    });

    await exporter.export();
    assert.deepEqual(readFileSync(copy), Buffer.from([1, 2]));
    assert.equal(exporter.exportedBySource.size, 1);

    config.inputPathFolder = second.replaceAll('\\', '/');
    await exporter.export();
    assert.deepEqual(readFileSync(copy), Buffer.from([3, 4, 5, 6]));
    assert.equal(exporter.exportedBySource.size, 1);
    assert.equal(exporter.exportedBySource.has(firstSource.replaceAll('\\', '/')), false);
    assert.equal(exporter.exportedBySource.has(secondSource.replaceAll('\\', '/')), true);

    rmSync(secondSource);
    await exporter.export();
    assert.equal(exporter.exportedBySource.size, 0);
    assert.equal(existsSync(copy), false);
    assert.equal(reloads, 3);
});
