import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static output inside its input is rediscovered and copied to deeper paths', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-recursive-output-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        settings: SettingsManager.instance, http: HttpServer.getInstance,
        server: GenericServer.instance,
    };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        HttpServer.getInstance = previous.http;
        GenericServer.instance = previous.server;
    });
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    HttpServer.getInstance = () => ({ reload() {} });
    GenericServer.instance = { logLevel: 99, connection: { sendNotification() {} } };

    const input = join(root, 'input');
    const output = join(input, 'generated');
    mkdirSync(input);
    const source = join(input, 'data.txt');
    writeFileSync(source, 'original');
    const target = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replaceAll('\\', '/'),
        outputPathFolder: [output.replaceAll('\\', '/')],
    });
    t.after(() => target.destroy());

    await target.export();
    assert.equal(readFileSync(join(output, 'data.txt'), 'utf8'), 'original');
    assert.equal(existsSync(join(output, 'generated', 'data.txt')), false);

    await target.export();
    assert.equal(readFileSync(join(output, 'generated', 'data.txt'), 'utf8'), 'original');

    rmSync(source);
    await target.export();
    assert.equal(existsSync(join(output, 'data.txt')), false);
    assert.equal(readFileSync(join(output, 'generated', 'generated', 'data.txt'), 'utf8'), 'original');
});
