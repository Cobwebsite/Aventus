import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('two static exports sharing an output leave the final copy after both sources are removed', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-cross-export-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const inputA = join(root, 'input-a');
    const inputB = join(root, 'input-b');
    const output = join(root, 'output');
    mkdirSync(inputA);
    mkdirSync(inputB);
    const sourceA = join(inputA, 'shared.bin');
    const sourceB = join(inputB, 'shared.bin');
    const target = join(output, 'shared.bin');
    writeFileSync(sourceA, Buffer.from([1, 2, 3]));
    writeFileSync(sourceB, Buffer.from([4, 5, 6, 7, 8]));

    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    const oldHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    const errors = [];
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} }, error: error => errors.push(error) };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const makeExporter = (name, input) => new Static({ scssFiles: {} }, {
        name, inputPathFolder: input.replace(/\\/g, '/'), outputPathFolder: [output.replace(/\\/g, '/')],
    });
    const first = makeExporter('first', inputA);
    const second = makeExporter('second', inputB);
    t.after(() => {
        first.destroy();
        second.destroy();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        HttpServer.getInstance = oldHttp;
    });

    await first.export();
    assert.deepEqual(readFileSync(target), Buffer.from([1, 2, 3]));
    await second.export();
    assert.deepEqual(readFileSync(target), Buffer.from([4, 5, 6, 7, 8]));

    rmSync(sourceA);
    await first.export();
    assert.deepEqual(readFileSync(target), Buffer.from([4, 5, 6, 7, 8]));
    assert.equal(first.exportedBySource.size, 0);

    rmSync(sourceB);
    await second.export();
    assert.equal(existsSync(target), true);
    assert.deepEqual(readFileSync(target), Buffer.from([4, 5, 6, 7, 8]));
    assert.equal(second.exportedBySource.size, 0);
    assert.equal(reloads, 4);
    assert.deepEqual(errors, []);
});
