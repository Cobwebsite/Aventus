import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('changing a static destination keeps its old copy until source removal', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-output-transition-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const firstOutput = join(root, 'first');
    const secondOutput = join(root, 'second');
    mkdirSync(input);
    const source = join(input, 'asset.bin');
    writeFileSync(source, Buffer.from([1, 2]));

    const previous = [SettingsManager.instance, GenericServer.instance, HttpServer.getInstance];
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    HttpServer.getInstance = () => ({ reload() {} });
    const config = {
        name: 'assets', inputPathFolder: input.replaceAll('\\', '/'),
        outputPathFolder: [firstOutput.replaceAll('\\', '/')],
    };
    const target = new Static({ scssFiles: {} }, config);
    t.after(() => {
        target.destroy();
        [SettingsManager.instance, GenericServer.instance, HttpServer.getInstance] = previous;
    });

    const firstCopy = join(firstOutput, 'asset.bin');
    const secondCopy = join(secondOutput, 'asset.bin');
    await target.export();
    assert.deepEqual(readFileSync(firstCopy), Buffer.from([1, 2]));

    config.outputPathFolder = [secondOutput.replaceAll('\\', '/')];
    writeFileSync(source, Buffer.from([3, 4]));
    await target.export();
    assert.deepEqual(readFileSync(secondCopy), Buffer.from([3, 4]));
    assert.deepEqual(readFileSync(firstCopy), Buffer.from([1, 2]),
        'the obsolete destination remains while its source still exists');

    rmSync(source);
    await target.export();
    assert.equal(existsSync(firstCopy), false);
    assert.equal(existsSync(secondCopy), false);
});
