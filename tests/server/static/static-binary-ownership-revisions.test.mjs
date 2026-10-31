import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

function setup(t, root, outputs) {
    const input = join(root, 'input');
    mkdirSync(input);
    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    const oldHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const exporter = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: outputs.map(path => path.replace(/\\/g, '/')),
    });
    t.after(() => {
        exporter.destroy();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        HttpServer.getInstance = oldHttp;
    });
    return { input, exporter, reloads: () => reloads };
}

test('a preexisting destination remains after several static revisions while a generated copy is removed', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-preexisting-revisions-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const outputs = [join(root, 'preexisting'), join(root, 'generated')];
    const original = join(outputs[0], 'asset.bin');
    mkdirSync(dirname(original), { recursive: true });
    writeFileSync(original, Buffer.from([0]));
    const { input, exporter, reloads } = setup(t, root, outputs);
    const source = join(input, 'asset.bin');
    writeFileSync(source, Buffer.from([1]));

    await exporter.export();
    writeFileSync(source, Buffer.from([2, 3]));
    await exporter.export();
    assert.deepEqual(readFileSync(original), Buffer.from([2, 3]));
    assert.deepEqual(readFileSync(join(outputs[1], 'asset.bin')), Buffer.from([2, 3]));

    rmSync(source);
    await exporter.export();
    assert.deepEqual(readFileSync(original), Buffer.from([2, 3]));
    assert.equal(existsSync(join(outputs[1], 'asset.bin')), false);
    assert.equal(reloads(), 3);
});

test('empty and Unicode named binary assets update and disappear from both destinations', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-unicode-revisions-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const outputs = [join(root, 'one'), join(root, 'two')];
    const { input, exporter } = setup(t, root, outputs);
    const relative = join('icônes', 'café.bin');
    const source = join(input, relative);
    mkdirSync(dirname(source), { recursive: true });
    writeFileSync(source, Buffer.alloc(0));

    await exporter.export();
    for (const output of outputs) assert.equal(readFileSync(join(output, relative)).length, 0);

    writeFileSync(source, Buffer.from([0, 255, 1]));
    await exporter.export();
    for (const output of outputs) assert.deepEqual(readFileSync(join(output, relative)), Buffer.from([0, 255, 1]));

    unlinkSync(source);
    assert.equal(existsSync(source), false);
    await exporter.export();
    for (const output of outputs) assert.equal(existsSync(join(output, relative)), false);
    assert.equal(exporter.exportedBySource.size, 0);
});
