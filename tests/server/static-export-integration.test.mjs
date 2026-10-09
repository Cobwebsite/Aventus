import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] =
    await loadServerModules([
        'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
    ]);

function fixture(t) {
    const root = mkdtempSync(join(import.meta.dirname, '.static-export-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const first = join(root, 'out-one');
    const second = join(root, 'out-two');
    mkdirSync(input);
    let reloads = 0;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    GenericServer.instance = { logLevel: 0, connection: { sendNotification: () => {} } };
    const target = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: [first.replace(/\\/g, '/'), second.replace(/\\/g, '/')],
    });
    return { input, first, second, target, get reloads() { return reloads; } };
}

test('static export copies top-level files to every configured output and refreshes changed content', async t => {
    const state = fixture(t);
    writeFileSync(join(state.input, 'data.txt'), 'version one');
    await state.target.export();
    assert.equal(state.target.name, 'assets');
    assert.equal(readFileSync(join(state.first, 'data.txt'), 'utf8'), 'version one');
    assert.equal(readFileSync(join(state.second, 'data.txt'), 'utf8'), 'version one');

    writeFileSync(join(state.input, 'data.txt'), 'version two');
    await state.target.export();
    assert.equal(readFileSync(join(state.first, 'data.txt'), 'utf8'), 'version two');
    assert.equal(readFileSync(join(state.second, 'data.txt'), 'utf8'), 'version two');
    assert.equal(state.reloads, 2);
    state.target.destroy();
});

test('static export compiles top-level SCSS and omits partials', async t => {
    const state = fixture(t);
    writeFileSync(join(state.input, '_palette.scss'), '$brand: red;');
    writeFileSync(join(state.input, 'style.scss'), '@use "palette"; .card { color: palette.$brand; }');
    await state.target.export();
    assert.equal(readFileSync(join(state.first, 'style.css'), 'utf8'), '.card{color:red}');
    assert.equal(readFileSync(join(state.second, 'style.css'), 'utf8'), '.card{color:red}');
    assert.equal(existsSync(join(state.first, '_palette.css')), false);
    assert.equal(existsSync(join(state.first, 'style.scss')), false);
    state.target.destroy();
});

test('static export preserves nested paths when copying subfolders', async t => {
    const state = fixture(t);
    mkdirSync(join(state.input, 'images', 'icons'), { recursive: true });
    writeFileSync(join(state.input, 'images', 'icons', 'logo.svg'), '<svg/>');
    await state.target.export();
    assert.equal(readFileSync(join(state.first, 'images', 'icons', 'logo.svg'), 'utf8'), '<svg/>');
    assert.equal(readFileSync(join(state.second, 'images', 'icons', 'logo.svg'), 'utf8'), '<svg/>');
    state.target.destroy();
});

test('static export retries a stylesheet successfully after a Sass error is fixed', async t => {
    const state = fixture(t);
    const source = join(state.input, 'style.scss');
    writeFileSync(source, '.card { color: $missing; }');
    const logged = [];
    const oldLog = console.log;
    console.log = error => logged.push(error);
    t.after(() => { console.log = oldLog; });
    await state.target.export();
    assert.equal(existsSync(join(state.first, 'style.css')), false);
    assert.equal(logged.length, 2); // One Sass failure per output folder.

    writeFileSync(source, '.card { color: blue; }');
    await state.target.export();
    assert.equal(readFileSync(join(state.first, 'style.css'), 'utf8'), '.card{color:blue}');
    assert.equal(readFileSync(join(state.second, 'style.css'), 'utf8'), '.card{color:blue}');
    state.target.destroy();
});
