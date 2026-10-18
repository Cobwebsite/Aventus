import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('SCSS export retries a blocked destination and later removes both owned outputs', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-scss-destination-retry-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const first = join(root, 'first');
    const second = join(root, 'second');
    mkdirSync(input);
    writeFileSync(second, 'blocks directory creation');
    const source = join(input, 'theme.scss');
    writeFileSync(source, '.theme { color: red; }');

    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    const oldHttp = HttpServer.getInstance;
    const oldError = GenericServer.error;
    const errors = [];
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    GenericServer.error = error => errors.push(error);
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const exporter = new Static({ scssFiles: {} }, {
        name: 'styles', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: [first, second].map(path => path.replace(/\\/g, '/')),
    });
    t.after(() => {
        exporter.destroy();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        GenericServer.error = oldError;
        HttpServer.getInstance = oldHttp;
    });
    const firstCss = join(first, 'theme.css');
    const secondCss = join(second, 'theme.css');

    await exporter.export();
    assert.equal(readFileSync(firstCss, 'utf8'), '.theme{color:red}');
    assert.equal(existsSync(secondCss), false);
    assert.equal(reloads, 0);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].code, 'ENOENT');

    unlinkSync(second);
    writeFileSync(source, '.theme { color: blue; }');
    await exporter.export();
    assert.equal(readFileSync(firstCss, 'utf8'), '.theme{color:blue}');
    assert.equal(readFileSync(secondCss, 'utf8'), '.theme{color:blue}');
    assert.equal(reloads, 1);

    rmSync(source);
    await exporter.export();
    assert.equal(existsSync(firstCss), false);
    assert.equal(existsSync(secondCss), false);
    assert.equal(exporter.exportedBySource.size, 0);
    assert.equal(reloads, 2);
    assert.equal(errors.length, 1);
});
