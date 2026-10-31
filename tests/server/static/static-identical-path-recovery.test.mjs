import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static export to its input folder preserves source ownership across destination change', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-same-path-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const output = join(root, 'output');
    mkdirSync(input);
    const source = join(input, 'asset.bin');
    const bytes = Buffer.from([0, 255, 42, 10]);
    writeFileSync(source, bytes);

    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        error: GenericServer.error, http: HttpServer.getInstance,
    };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        GenericServer.error = previous.error;
        HttpServer.getInstance = previous.http;
    });
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 99, connection: { sendNotification() {} } };
    const errors = [];
    GenericServer.error = error => errors.push(error);
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload() { reloads++; } });

    const config = {
        name: 'assets', inputPathFolder: input.replaceAll('\\', '/'),
        outputPathFolder: [input.replaceAll('\\', '/')],
    };
    const target = new Static({ scssFiles: {} }, config);
    t.after(() => target.destroy());

    await target.export();
    assert.deepEqual(readFileSync(source), bytes);
    assert.equal(errors.length, 0);
    assert.equal(reloads, 1);
    assert.equal(target.exportedBySource.size, 1);

    config.outputPathFolder = [output.replaceAll('\\', '/')];
    await target.export();
    assert.deepEqual(readFileSync(join(output, 'asset.bin')), bytes);
    assert.equal(errors.length, 0);
    assert.equal(reloads, 2);

    rmSync(source);
    await target.export();
    assert.equal(existsSync(join(output, 'asset.bin')), false);
});
