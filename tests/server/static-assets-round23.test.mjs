import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

function fixture(t) {
    const root = mkdtempSync(join(import.meta.dirname, '.static-assets-round23-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'one'), join(root, 'two')];
    mkdirSync(join(input, 'nested'), { recursive: true });
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload() { reloads++; } });
    const target = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: outputs.map(path => path.replace(/\\/g, '/')),
    });
    t.after(() => target.destroy());
    return { input, outputs, target, get reloads() { return reloads; } };
}

test('static export copies nested binary assets without changing bytes to every destination', async t => {
    const state = fixture(t);
    const bytes = Buffer.from([0, 255, 1, 127, 0, 42]);
    writeFileSync(join(state.input, 'nested', 'icon.bin'), bytes);
    await state.target.export();
    for (const output of state.outputs) {
        assert.deepEqual(readFileSync(join(output, 'nested', 'icon.bin')), bytes);
    }
    assert.equal(state.reloads, 1);
});

test('static export compiles SCSS independently to every destination and ignores partial output', async t => {
    const state = fixture(t);
    writeFileSync(join(state.input, 'nested', '_theme.scss'), '$tone: #123456;');
    writeFileSync(join(state.input, 'nested', 'site.scss'), '@use "theme"; .site { color: theme.$tone; }');
    await state.target.export();
    for (const output of state.outputs) {
        assert.equal(readFileSync(join(output, 'nested', 'site.css'), 'utf8'), '.site{color:#123456}');
        assert.equal(existsSync(join(output, 'nested', '_theme.css')), false);
        assert.equal(existsSync(join(output, 'nested', 'site.scss')), false);
    }
    assert.equal(state.reloads, 1);
});

test('static export refreshes changed nested assets in every destination', async t => {
    const state = fixture(t);
    const source = join(state.input, 'nested', 'data.json');
    writeFileSync(source, '{"revision":1}');
    await state.target.export();
    writeFileSync(source, '{"revision":2,"enabled":true}');
    await state.target.export();
    for (const output of state.outputs) {
        assert.equal(readFileSync(join(output, 'nested', 'data.json'), 'utf8'), '{"revision":2,"enabled":true}');
    }
    assert.equal(state.reloads, 2);
});

test('static export with an empty source does not create destination folders', async t => {
    const state = fixture(t);
    await state.target.export();
    for (const output of state.outputs) assert.equal(existsSync(output), false);
    assert.equal(state.reloads, 1);
});
