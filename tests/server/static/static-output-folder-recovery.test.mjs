import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static export recreates a removed destination folder and still cleans both owned copies', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-output-folder-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'first'), join(root, 'second')];
    const source = join(input, 'icons', 'logo.bin');
    const copies = outputs.map(output => join(output, 'icons', 'logo.bin'));
    mkdirSync(join(input, 'icons'), { recursive: true });
    writeFileSync(source, Buffer.from([1, 2, 3]));

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
    for (const copy of copies) assert.deepEqual(readFileSync(copy), Buffer.from([1, 2, 3]));

    rmSync(outputs[0], { recursive: true });
    writeFileSync(source, Buffer.from([4, 5]));
    await exporter.export();
    for (const copy of copies) assert.deepEqual(readFileSync(copy), Buffer.from([4, 5]));

    unlinkSync(source);
    await exporter.export();
    for (const copy of copies) assert.equal(existsSync(copy), false);
    assert.equal(exporter.exportedBySource.size, 0);
    assert.equal(reloads, 3);
});
