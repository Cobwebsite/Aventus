import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('colliding CSS and SCSS sources keep current output ownership across revisions and two destinations', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-source-collision-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const preexisting = join(root, 'preexisting');
    const generated = join(root, 'generated');
    mkdirSync(input);
    mkdirSync(preexisting);
    const css = join(input, 'theme.css');
    const scss = join(input, 'theme.scss');
    const original = join(preexisting, 'theme.css');
    const fresh = join(generated, 'theme.css');
    writeFileSync(original, 'outside');
    writeFileSync(css, '/* copied stylesheet with a deliberately distinct size */');
    writeFileSync(scss, '.theme { color: red; }');

    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    const oldHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    HttpServer.getInstance = () => ({ reload() {} });
    const exporter = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: [preexisting, generated].map(path => path.replace(/\\/g, '/')),
    });
    t.after(() => {
        exporter.destroy();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        HttpServer.getInstance = oldHttp;
    });

    await exporter.export();
    assert.equal(readFileSync(original, 'utf8'), '.theme{color:red}');
    assert.equal(readFileSync(fresh, 'utf8'), '.theme{color:red}');

    writeFileSync(scss, '.theme { color: blue; }');
    await exporter.export();
    assert.equal(readFileSync(fresh, 'utf8'), '.theme{color:blue}');

    rmSync(scss);
    await exporter.export();
    const copied = readFileSync(css, 'utf8');
    assert.equal(readFileSync(original, 'utf8'), copied);
    assert.equal(readFileSync(fresh, 'utf8'), copied);

    rmSync(css);
    await exporter.export();
    assert.equal(readFileSync(original, 'utf8'), copied);
    assert.equal(existsSync(fresh), false);
    assert.equal(exporter.exportedBySource.size, 0);
});
