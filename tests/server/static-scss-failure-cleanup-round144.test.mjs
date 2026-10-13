import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static SCSS failure keeps its last output while other files update, then cleans it after source removal', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-scss-failure-cleanup-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const output = join(root, 'output');
    mkdirSync(input);
    const source = join(input, 'theme.scss');
    const other = join(input, 'message.txt');
    const css = join(output, 'theme.css');
    writeFileSync(source, '.theme { color: red; }');
    writeFileSync(other, 'first');

    const previousSettings = SettingsManager.instance;
    const previousGeneric = GenericServer.instance;
    const previousHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload() { reloads++; } });
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousGeneric;
        HttpServer.getInstance = previousHttp;
    });
    const target = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: [output.replace(/\\/g, '/')],
    });
    t.after(() => target.destroy());

    await target.export();
    assert.equal(readFileSync(css, 'utf8'), '.theme{color:red}');
    writeFileSync(source, '.theme { color: $missing; }');
    writeFileSync(other, 'second');
    const errors = [];
    const previousLog = console.log;
    console.log = error => errors.push(error);
    try { await target.export(); } finally { console.log = previousLog; }
    assert.equal(errors.length, 1);
    assert.match(String(errors[0]), /Undefined variable/);
    assert.equal(readFileSync(css, 'utf8'), '.theme{color:red}');
    assert.equal(readFileSync(join(output, 'message.txt'), 'utf8'), 'second');

    unlinkSync(source);
    await target.export();
    assert.equal(existsSync(css), false);
    writeFileSync(source, '.theme { color: blue; }');
    await target.export();
    assert.equal(readFileSync(css, 'utf8'), '.theme{color:blue}');
    assert.equal(reloads, 3);
});
