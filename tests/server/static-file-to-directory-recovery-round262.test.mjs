import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static export recovers when a source file becomes a directory at the same path', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-file-dir-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const output = join(root, 'output');
    const sourcePath = join(input, 'asset');
    const outputPath = join(output, 'asset');
    mkdirSync(input);
    writeFileSync(sourcePath, Buffer.from([1, 2]));

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
    const exporter = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replaceAll('\\', '/'),
        outputPathFolder: [output.replaceAll('\\', '/')],
    });
    t.after(() => {
        exporter.destroy();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        GenericServer.error = oldError;
        HttpServer.getInstance = oldHttp;
    });

    await exporter.export();
    assert.deepEqual(readFileSync(outputPath), Buffer.from([1, 2]));
    assert.equal(reloads, 1);

    rmSync(sourcePath);
    mkdirSync(sourcePath);
    writeFileSync(join(sourcePath, 'new.bin'), Buffer.from([3, 4, 5]));
    await exporter.export();
    assert.equal(errors.length, 0);
    assert.equal(reloads, 2);
    assert.deepEqual(readFileSync(join(outputPath, 'new.bin')), Buffer.from([3, 4, 5]));

    rmSync(sourcePath, { recursive: true });
    await exporter.export();
    assert.equal(existsSync(join(outputPath, 'new.bin')), false);
    assert.equal(exporter.exportedBySource.size, 0);
});
