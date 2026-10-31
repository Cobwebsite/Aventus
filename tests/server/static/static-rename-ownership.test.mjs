import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static source renames replace owned paths while preserving preexisting and externally edited copies', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-renames-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'first'), join(root, 'second')];
    mkdirSync(join(input, 'nested'), { recursive: true });
    mkdirSync(join(outputs[0], 'nested'), { recursive: true });
    const sourceA = join(input, 'nested', 'a.bin');
    const sourceB = join(input, 'nested', 'b.bin');
    const sourceC = join(input, 'c.bin');
    const destination = (index, name) => join(outputs[index], name);
    const original = destination(0, join('nested', 'a.bin'));
    writeFileSync(original, 'preexisting copy');
    writeFileSync(sourceA, Buffer.from([1, 2, 3]));

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

    await exporter.export();
    for (let index = 0; index < 2; index++) {
        assert.deepEqual(readFileSync(destination(index, join('nested', 'a.bin'))), Buffer.from([1, 2, 3]));
    }

    renameSync(sourceA, sourceB);
    await exporter.export();
    assert.deepEqual(readFileSync(original), Buffer.from([1, 2, 3]));
    assert.equal(existsSync(destination(1, join('nested', 'a.bin'))), false);
    for (let index = 0; index < 2; index++) {
        assert.deepEqual(readFileSync(destination(index, join('nested', 'b.bin'))), Buffer.from([1, 2, 3]));
    }

    const externallyEdited = destination(1, join('nested', 'b.bin'));
    writeFileSync(externallyEdited, Buffer.from([9, 8, 7, 6, 5]));
    renameSync(sourceB, sourceC);
    await exporter.export();
    assert.equal(existsSync(destination(0, join('nested', 'b.bin'))), false);
    assert.deepEqual(readFileSync(externallyEdited), Buffer.from([9, 8, 7, 6, 5]));
    for (let index = 0; index < 2; index++) {
        assert.deepEqual(readFileSync(destination(index, 'c.bin')), Buffer.from([1, 2, 3]));
    }

    rmSync(sourceC);
    await exporter.export();
    for (let index = 0; index < 2; index++) assert.equal(existsSync(destination(index, 'c.bin')), false);
    assert.equal(exporter.exportedBySource.size, 0);
    assert.equal(reloads, 4);
});
