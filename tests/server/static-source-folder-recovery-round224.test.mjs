import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static export recovers when its whole source folder disappears and returns', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-folder-recovery-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'owned'), join(root, 'preexisting')];
    const source = join(input, 'nested', 'asset.bin');
    const outputFiles = outputs.map(output => join(output, 'nested', 'asset.bin'));
    mkdirSync(join(input, 'nested'), { recursive: true });
    mkdirSync(join(outputs[1], 'nested'), { recursive: true });
    writeFileSync(source, Buffer.from([1, 2, 3]));
    writeFileSync(outputFiles[1], Buffer.from([9]));
    writeFileSync(join(outputs[1], 'foreign.txt'), 'untouched');

    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    const oldHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const exporter = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: outputs.map(output => output.replace(/\\/g, '/')),
    });
    t.after(() => {
        exporter.destroy();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        HttpServer.getInstance = oldHttp;
    });

    await exporter.export();
    for (const file of outputFiles) assert.deepEqual(readFileSync(file), Buffer.from([1, 2, 3]));

    rmSync(input, { recursive: true });
    await exporter.export();
    assert.equal(existsSync(outputFiles[0]), false);
    assert.deepEqual(readFileSync(outputFiles[1]), Buffer.from([1, 2, 3]));
    assert.equal(readFileSync(join(outputs[1], 'foreign.txt'), 'utf8'), 'untouched');
    assert.equal(exporter.exportedBySource.size, 0);

    mkdirSync(join(input, 'nested'), { recursive: true });
    writeFileSync(source, Buffer.from([4, 5]));
    await exporter.export();
    for (const file of outputFiles) assert.deepEqual(readFileSync(file), Buffer.from([4, 5]));

    rmSync(input, { recursive: true });
    await exporter.export();
    assert.equal(existsSync(outputFiles[0]), false);
    assert.deepEqual(readFileSync(outputFiles[1]), Buffer.from([4, 5]));
    assert.equal(exporter.exportedBySource.size, 0);
    assert.equal(reloads, 4);
});
