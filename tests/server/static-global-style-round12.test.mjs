import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }, { FilesManager }] =
    await loadServerModules([
        'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts',
        'GenericServer.ts', 'files/FilesManager.ts',
    ]);

function fixture(t) {
    const root = mkdtempSync(join(import.meta.dirname, '.static-global-style-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'first'), join(root, 'second')];
    mkdirSync(join(input, 'theme'), { recursive: true });
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification: () => {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const added = [];
    const registered = [];
    const project = { scssFiles: {} };
    FilesManager.instance = {
        registerFile: async doc => {
            registered.push(doc);
            project.scssFiles[doc.uri] = { addOutPath: async (...args) => added.push(args) };
        },
    };
    const target = new Static(project, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: outputs.map(path => path.replace(/\\/g, '/')),
    });
    t.after(() => target.destroy());
    return { input, outputs, project, target, added, registered, get reloads() { return reloads; } };
}

test('static export registers a nested global style once and attaches every output path', async t => {
    const state = fixture(t);
    writeFileSync(join(state.input, 'theme', 'site.gs.avt'), ':root { --brand: blue; }');
    writeFileSync(join(state.input, 'theme', 'component.wc.avt'), 'component source');

    await state.target.export();
    assert.equal(state.registered.length, 1);
    assert.match(state.registered[0].uri, /site\.gs\.avt$/);
    assert.equal(state.registered[0].getText(), ':root { --brand: blue; }');
    assert.deepEqual(state.added, state.outputs.map(path => [join(path, 'theme', 'site.css').replace(/\\/g, '/'), 'assets']));
    assert.equal(state.reloads, 1);
    for (const output of state.outputs) {
        assert.equal(existsSync(join(output, 'theme', 'site.gs.avt')), false);
        assert.equal(existsSync(join(output, 'theme', 'component.wc.avt')), false);
    }

    await state.target.export();
    assert.equal(state.registered.length, 1);
    assert.deepEqual(state.added.slice(2), state.added.slice(0, 2));
    assert.equal(state.reloads, 2);
});
