import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static SCSS output follows imported partial edits and recovers after invalid source', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-scss-cycle-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'first'), join(root, 'second')];
    mkdirSync(join(input, 'theme'), { recursive: true });
    const partial = join(input, 'theme', '_colors.scss');
    const sheet = join(input, 'theme', 'main.scss');
    writeFileSync(partial, '$accent: red;');
    writeFileSync(sheet, '@use "colors"; .main { color: colors.$accent; }');

    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload() { reloads++; } });
    const target = new Static({ scssFiles: {} }, {
        name: 'styles', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: outputs.map(path => path.replace(/\\/g, '/')),
    });
    t.after(() => target.destroy());
    const css = output => readFileSync(join(output, 'theme', 'main.css'), 'utf8');

    await target.export();
    for (const output of outputs) assert.equal(css(output), '.main{color:red}');

    writeFileSync(partial, '$accent: blue;');
    await target.export();
    for (const output of outputs) assert.equal(css(output), '.main{color:blue}');

    const failures = [];
    const previousLog = console.log;
    console.log = error => failures.push(error);
    t.after(() => { console.log = previousLog; });
    writeFileSync(partial, '$accent: $missing;');
    await target.export();
    assert.equal(failures.length, 2);
    for (const output of outputs) assert.equal(css(output), '.main{color:blue}');

    writeFileSync(partial, '$accent: green;');
    await target.export();
    for (const output of outputs) assert.equal(css(output), '.main{color:green}');
    assert.equal(reloads, 4);
});

test('static export accepts an absent input folder and exports files created afterward', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-late-source-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const output = join(root, 'output');
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload() { reloads++; } });
    const target = new Static({ scssFiles: {} }, {
        name: 'late', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: [output.replace(/\\/g, '/')],
    });
    t.after(() => target.destroy());

    await target.export();
    assert.equal(existsSync(output), false);
    mkdirSync(join(input, 'nested'), { recursive: true });
    writeFileSync(join(input, 'nested', 'new.txt'), 'created');
    await target.export();
    assert.equal(readFileSync(join(output, 'nested', 'new.txt'), 'utf8'), 'created');
    assert.equal(reloads, 2);
});
