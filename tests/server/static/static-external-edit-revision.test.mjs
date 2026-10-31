import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('a revised static source reclaims an externally edited generated copy in both destinations', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-reclaim-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'first'), join(root, 'second')];
    mkdirSync(input);
    const source = join(input, 'asset.bin');
    const destinations = outputs.map(output => join(output, 'asset.bin'));

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

    // State 1: the exporter creates both copies and owns them.
    writeFileSync(source, Buffer.from([1, 2]));
    await exporter.export();
    for (const destination of destinations) assert.deepEqual(readFileSync(destination), Buffer.from([1, 2]));

    // State 2: an external edit in one destination is replaced by the next source revision.
    writeFileSync(destinations[1], Buffer.from([9, 9, 9]));
    writeFileSync(source, Buffer.from([3, 4, 5, 6]));
    await exporter.export();
    for (const destination of destinations) assert.deepEqual(readFileSync(destination), Buffer.from([3, 4, 5, 6]));

    // State 3: both copies still belong to this exporter and are cleaned up.
    unlinkSync(source);
    await exporter.export();
    for (const destination of destinations) assert.equal(existsSync(destination), false);
    assert.equal(exporter.exportedBySource.size, 0);
    assert.equal(reloads, 3);
});
