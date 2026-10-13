import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static export isolates a blocked destination, then retries it and reports only completed copies', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.static-recovery-round59-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const first = join(root, 'first');
    const second = join(root, 'second');
    mkdirSync(join(input, 'nested'), { recursive: true });
    mkdirSync(first);
    writeFileSync(join(input, 'nested', 'asset.bin'), Buffer.from([0, 255, 42]));
    writeFileSync(join(first, 'nested'), 'obstruction');

    const events = [];
    const errors = [];
    SettingsManager.instance = { settings: { watchFiles: false, useStats: true } };
    GenericServer.instance = {
        logLevel: 999,
        connection: { sendNotification: (name, params) => events.push({ name, params }) },
    };
    HttpServer.getInstance = () => ({ reload: () => events.push({ name: 'reload' }) });
    const originalLog = console.log;
    console.log = error => errors.push(error);
    t.after(() => { console.log = originalLog; });
    const target = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: [first, second].map(path => path.replace(/\\/g, '/')),
    });
    t.after(() => target.destroy());

    await target.export();
    assert.equal(errors.length, 1);
    assert.equal(existsSync(join(first, 'nested', 'asset.bin')), false);
    assert.deepEqual(readFileSync(join(second, 'nested', 'asset.bin')), Buffer.from([0, 255, 42]));
    assert.deepEqual(events.map(event => event.name), [
        'aventus/statistics/fileSize',
    ]);
    assert.equal(events[0].params[0], join(second, 'nested', 'asset.bin'));
    assert.deepEqual(events[0].params.slice(1), [3, 'static', 'assets']);

    unlinkSync(join(first, 'nested'));
    writeFileSync(join(input, 'nested', 'asset.bin'), Buffer.from([1, 2, 3, 4]));
    events.length = 0;
    await target.export();
    for (const output of [first, second]) {
        assert.deepEqual(readFileSync(join(output, 'nested', 'asset.bin')), Buffer.from([1, 2, 3, 4]));
    }
    assert.equal(errors.length, 1);
    assert.deepEqual(events.map(event => event.name), [
        'aventus/statistics/fileSize', 'aventus/statistics/fileSize',
        'reload', 'aventus/statistics/staticTime',
    ]);
    assert.deepEqual(events.slice(0, 2).map(event => event.params[0]), [
        join(first, 'nested', 'asset.bin'), join(second, 'nested', 'asset.bin'),
    ]);
    assert.deepEqual(events.slice(0, 2).map(event => event.params[1]), [4, 4]);
});
