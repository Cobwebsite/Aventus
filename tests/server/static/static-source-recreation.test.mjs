import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('a deleted static source can be recreated at the same path without stale ownership', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-recreate-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const first = join(root, 'first');
    const second = join(root, 'second');
    const source = join(input, 'asset.bin');
    const copies = [join(first, 'asset.bin'), join(second, 'asset.bin')];
    mkdirSync(input);
    mkdirSync(second);
    writeFileSync(copies[1], Buffer.from([9]));
    writeFileSync(source, Buffer.from([1]));

    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    const previousHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const exporter = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replaceAll('\\', '/'),
        outputPathFolder: [first, second].map(path => path.replaceAll('\\', '/')),
    });
    t.after(() => {
        exporter.destroy();
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        HttpServer.getInstance = previousHttp;
    });

    await exporter.export();
    for (const copy of copies) assert.deepEqual(readFileSync(copy), Buffer.from([1]));
    rmSync(source);
    await exporter.export();
    assert.equal(existsSync(copies[0]), false);
    assert.deepEqual(readFileSync(copies[1]), Buffer.from([1]));
    assert.equal(exporter.exportedBySource.size, 0);

    writeFileSync(source, Buffer.from([2, 3]));
    await exporter.export();
    for (const copy of copies) assert.deepEqual(readFileSync(copy), Buffer.from([2, 3]));
    assert.equal(exporter.exportedBySource.size, 1);
    rmSync(source);
    await exporter.export();
    assert.equal(existsSync(copies[0]), false);
    assert.deepEqual(readFileSync(copies[1]), Buffer.from([2, 3]));
    assert.equal(exporter.exportedBySource.size, 0);
    assert.equal(reloads, 4);
});
