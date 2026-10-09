import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

function setup(t) {
    const root = mkdtempSync(join(import.meta.dirname, '.static-round8-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const output = join(root, 'output');
    mkdirSync(input);
    let reloads = 0;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    GenericServer.instance = { logLevel: 0, connection: { sendNotification: () => {} } };
    const target = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: [output.replace(/\\/g, '/')],
    });
    return { input, output, target, get reloads() { return reloads; } };
}

test('static export compiles nested SCSS with a sibling partial and keeps relative output paths', async t => {
    const { input, output, target } = setup(t);
    mkdirSync(join(input, 'themes', 'dark'), { recursive: true });
    writeFileSync(join(input, 'themes', 'dark', '_tokens.scss'), '$accent: #123456;');
    writeFileSync(join(input, 'themes', 'dark', 'app.scss'), '@use "tokens"; .theme { color: tokens.$accent; }');
    await target.export();
    assert.equal(readFileSync(join(output, 'themes', 'dark', 'app.css'), 'utf8'), '.theme{color:#123456}');
    assert.equal(existsSync(join(output, 'themes', 'dark', '_tokens.css')), false);
    assert.equal(existsSync(join(output, 'themes', 'dark', 'app.scss')), false);
    target.destroy();
});

test('an invalid stylesheet does not prevent unrelated assets from exporting or a later retry', async t => {
    const { input, output, target } = setup(t);
    writeFileSync(join(input, 'broken.scss'), '.broken { color: $undefined; }');
    writeFileSync(join(input, 'logo.svg'), '<svg>ready</svg>');
    const oldLog = console.log;
    const failures = [];
    console.log = error => failures.push(error);
    t.after(() => { console.log = oldLog; });
    await target.export();
    assert.equal(failures.length, 1);
    assert.equal(existsSync(join(output, 'broken.css')), false);
    assert.equal(readFileSync(join(output, 'logo.svg'), 'utf8'), '<svg>ready</svg>');
    writeFileSync(join(input, 'broken.scss'), '.fixed { color: green; }');
    await target.export();
    assert.equal(readFileSync(join(output, 'broken.css'), 'utf8'), '.fixed{color:green}');
    target.destroy();
});

test('removing a source currently leaves its previous static output while other files refresh', async t => {
    const { input, output, target } = setup(t);
    writeFileSync(join(input, 'removed.txt'), 'old');
    writeFileSync(join(input, 'retained.txt'), 'first');
    await target.export();
    unlinkSync(join(input, 'removed.txt'));
    writeFileSync(join(input, 'retained.txt'), 'second');
    await target.export();
    assert.equal(readFileSync(join(output, 'removed.txt'), 'utf8'), 'old');
    assert.equal(readFileSync(join(output, 'retained.txt'), 'utf8'), 'second');
    target.destroy();
});

