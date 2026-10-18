import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static export leaves its own copy when two destination aliases normalize to one output', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-alias-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const output = join(root, 'output');
    mkdirSync(input);
    const source = join(input, 'asset.bin');
    const copy = join(output, 'asset.bin');
    writeFileSync(source, Buffer.from([1, 2]));

    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    const oldHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const exporter = new Static({ scssFiles: {} }, {
        name: 'assets',
        inputPathFolder: input.replaceAll('\\', '/'),
        outputPathFolder: [output.replaceAll('\\', '/'), `${output.replaceAll('\\', '/')}/nested/..`],
    });
    t.after(() => {
        exporter.destroy();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        HttpServer.getInstance = oldHttp;
    });

    await exporter.export();
    assert.deepEqual(readFileSync(copy), Buffer.from([1, 2]));
    assert.equal(exporter.exportedBySource.get(source.replaceAll('\\', '/')).size, 1);
    assert.equal([...exporter.exportedBySource.get(source.replaceAll('\\', '/')).values()][0].canDelete, false);

    writeFileSync(source, Buffer.from([3, 4, 5]));
    await exporter.export();
    assert.deepEqual(readFileSync(copy), Buffer.from([3, 4, 5]));
    assert.equal(exporter.exportedBySource.get(source.replaceAll('\\', '/')).size, 1);

    unlinkSync(source);
    await exporter.export();
    assert.equal(existsSync(copy), true);
    assert.deepEqual(readFileSync(copy), Buffer.from([3, 4, 5]));
    assert.equal(exporter.exportedBySource.size, 0);
    assert.equal(reloads, 3);
});
