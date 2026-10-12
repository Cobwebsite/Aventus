import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static export follows a removed and recreated nested directory while retaining its old output', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-directory-cycle-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'public');
    const nested = join(input, 'icons');
    const outputs = [join(root, 'first'), join(root, 'second')];
    mkdirSync(nested, { recursive: true });
    writeFileSync(join(nested, 'old.svg'), '<svg id="old"/>');
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload() { reloads++; } });
    const target = new Static({ scssFiles: {} }, {
        name: 'icons', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: outputs.map(path => path.replace(/\\/g, '/')),
    });
    t.after(() => target.destroy());

    await target.export();
    for (const output of outputs) {
        assert.equal(readFileSync(join(output, 'icons', 'old.svg'), 'utf8'), '<svg id="old"/>');
    }

    rmSync(nested, { recursive: true });
    await target.export();
    for (const output of outputs) {
        assert.equal(existsSync(join(output, 'icons', 'old.svg')), true);
    }

    mkdirSync(nested);
    writeFileSync(join(nested, 'new.svg'), '<svg id="new"/>');
    await target.export();
    for (const output of outputs) {
        assert.equal(readFileSync(join(output, 'icons', 'new.svg'), 'utf8'), '<svg id="new"/>');
        assert.equal(readFileSync(join(output, 'icons', 'old.svg'), 'utf8'), '<svg id="old"/>');
    }
    assert.equal(reloads, 3);
});
