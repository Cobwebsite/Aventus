import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static output destinations can be removed and restored across source revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-output-list-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const first = join(root, 'first');
    const second = join(root, 'second');
    const source = join(input, 'asset.bin');
    const firstCopy = join(first, 'asset.bin');
    const secondCopy = join(second, 'asset.bin');
    mkdirSync(input);
    writeFileSync(source, Buffer.from([1]));

    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    const previousHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const config = {
        name: 'assets', inputPathFolder: input.replaceAll('\\', '/'),
        outputPathFolder: [first, second].map(path => path.replaceAll('\\', '/')),
    };
    const exporter = new Static({ scssFiles: {} }, config);
    t.after(() => {
        exporter.destroy();
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        HttpServer.getInstance = previousHttp;
    });

    await exporter.export();
    assert.deepEqual(readFileSync(firstCopy), Buffer.from([1]));
    assert.deepEqual(readFileSync(secondCopy), Buffer.from([1]));

    config.outputPathFolder.shift();
    writeFileSync(source, Buffer.from([2, 3]));
    await exporter.export();
    assert.deepEqual(readFileSync(firstCopy), Buffer.from([1]));
    assert.deepEqual(readFileSync(secondCopy), Buffer.from([2, 3]));
    assert.equal(exporter.exportedBySource.get(source.replaceAll('\\', '/')).size, 2);

    config.outputPathFolder.unshift(first.replaceAll('\\', '/'));
    writeFileSync(source, Buffer.from([4]));
    await exporter.export();
    assert.deepEqual(readFileSync(firstCopy), Buffer.from([4]));
    assert.deepEqual(readFileSync(secondCopy), Buffer.from([4]));

    rmSync(source);
    await exporter.export();
    assert.equal(existsSync(firstCopy), false);
    assert.equal(existsSync(secondCopy), false);
    assert.equal(exporter.exportedBySource.size, 0);
    assert.equal(reloads, 4);
});
