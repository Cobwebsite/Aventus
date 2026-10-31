import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static export refreshes a recreated source at the same path in every destination', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-file-recreation-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'first'), join(root, 'second')];
    mkdirSync(join(input, 'nested'), { recursive: true });
    const source = join(input, 'nested', 'icon.bin');
    const firstBytes = Buffer.from([0, 255, 1]);
    const secondBytes = Buffer.from([1, 0, 254, 2]);
    writeFileSync(source, firstBytes);

    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload() { reloads++; } });
    const target = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: outputs.map(path => path.replace(/\\/g, '/')),
    });
    t.after(() => target.destroy());
    const copied = output => join(output, 'nested', 'icon.bin');

    await target.export();
    for (const output of outputs) assert.deepEqual(readFileSync(copied(output)), firstBytes);

    unlinkSync(source);
    await target.export();
    for (const output of outputs) assert.equal(existsSync(copied(output)), false);

    writeFileSync(source, secondBytes);
    await target.export();
    for (const output of outputs) {
        assert.equal(existsSync(copied(output)), true);
        assert.deepEqual(readFileSync(copied(output)), secondBytes);
    }
    assert.equal(reloads, 3);
});

test('static SCSS export recompiles a recreated entry file after an absent interval', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-scss-recreation-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const output = join(root, 'output');
    mkdirSync(input);
    const source = join(input, 'theme.scss');
    const compiled = join(output, 'theme.css');
    writeFileSync(source, '.theme { color: red; }');

    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload() { reloads++; } });
    const target = new Static({ scssFiles: {} }, {
        name: 'theme', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: [output.replace(/\\/g, '/')],
    });
    t.after(() => target.destroy());

    await target.export();
    assert.equal(readFileSync(compiled, 'utf8'), '.theme{color:red}');
    unlinkSync(source);
    await target.export();
    assert.equal(existsSync(compiled), false);
    writeFileSync(source, '.theme { color: blue; }');
    await target.export();
    assert.equal(readFileSync(compiled, 'utf8'), '.theme{color:blue}');
    assert.equal(existsSync(join(output, 'theme.scss')), false);
    assert.equal(reloads, 3);
});
