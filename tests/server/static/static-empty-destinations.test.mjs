import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static export tracks copies after an empty destination list and removes them when the source disappears', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-empty-destinations-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'first'), join(root, 'second')];
    mkdirSync(input);
    const source = join(input, 'asset.bin');
    const copies = outputs.map(output => join(output, 'asset.bin'));
    writeFileSync(source, Buffer.from([1, 2]));

    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    const oldHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 99, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const config = { name: 'assets', inputPathFolder: input.replaceAll('\\', '/'), outputPathFolder: [] };
    const exporter = new Static({ scssFiles: {} }, config);
    t.after(() => {
        exporter.destroy();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        HttpServer.getInstance = oldHttp;
    });

    await exporter.export();
    assert.equal(exporter.exportedBySource.size, 0);
    for (const copy of copies) assert.equal(existsSync(copy), false);

    config.outputPathFolder.push(...outputs.map(output => output.replaceAll('\\', '/')));
    await exporter.export();
    for (const copy of copies) assert.deepEqual(readFileSync(copy), Buffer.from([1, 2]));
    assert.equal(exporter.exportedBySource.get(source.replaceAll('\\', '/')).size, 2);

    config.outputPathFolder.length = 0;
    writeFileSync(source, Buffer.from([3, 4, 5]));
    await exporter.export();
    for (const copy of copies) assert.deepEqual(readFileSync(copy), Buffer.from([1, 2]));

    rmSync(source);
    await exporter.export();
    for (const copy of copies) assert.equal(existsSync(copy), false);
    assert.equal(exporter.exportedBySource.size, 0);
    assert.equal(reloads, 4);
});
