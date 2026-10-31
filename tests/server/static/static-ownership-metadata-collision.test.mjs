import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

// Accepted limit of metadata-only ownership checks: this test forces a collision without hashing every asset.
test('static cleanup deletes an externally changed output when its recorded metadata matches', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-metadata-collision-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const output = join(root, 'output');
    mkdirSync(input);
    const source = join(input, 'asset.bin');
    const target = join(output, 'asset.bin');
    writeFileSync(source, Buffer.from([1, 2, 3, 4]));
    const previous = {
        settings: SettingsManager.instance,
        server: GenericServer.instance,
        http: HttpServer.getInstance,
    };
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    HttpServer.getInstance = () => ({ reload() {} });
    const exporter = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: [output.replace(/\\/g, '/')],
    });
    t.after(() => {
        exporter.destroy();
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        HttpServer.getInstance = previous.http;
    });

    await exporter.export();
    const originalStats = statSync(target);
    writeFileSync(target, Buffer.from([9, 8, 7, 6]));
    const editedStats = statSync(target);
    assert.equal(editedStats.size, originalStats.size);
    assert.deepEqual(readFileSync(target), Buffer.from([9, 8, 7, 6]));
    const record = exporter.exportedBySource.get(source.replace(/\\/g, '/')).get(target);
    record.mtimeMs = editedStats.mtimeMs;

    unlinkSync(source);
    await exporter.export();
    assert.equal(existsSync(target), false);
});
