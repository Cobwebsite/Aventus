import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('a destroyed static exporter still copies later source edits and reloads clients', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-destroy-export-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const output = join(root, 'output');
    mkdirSync(input);
    const source = join(input, 'asset.txt');
    const destination = join(output, 'asset.txt');
    writeFileSync(source, 'first');

    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload() { reloads++; } });
    const target = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: [output.replace(/\\/g, '/')],
    });

    await target.export();
    assert.equal(readFileSync(destination, 'utf8'), 'first');
    assert.equal(reloads, 1);

    target.destroy();
    writeFileSync(source, 'second');
    await target.export();
    assert.equal(readFileSync(destination, 'utf8'), 'second');
    assert.equal(reloads, 2);
});
