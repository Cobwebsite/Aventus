import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('removing an SCSS source deletes owned CSS but preserves CSS that existed before export', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-scss-ownership-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const first = join(root, 'first');
    const second = join(root, 'second');
    mkdirSync(input);
    mkdirSync(first);
    const source = join(input, 'site.scss');
    const firstCss = join(first, 'site.css');
    const secondCss = join(second, 'site.css');
    writeFileSync(source, '.site { color: red; }');
    writeFileSync(firstCss, '/* other owner */');

    const previousSettings = SettingsManager.instance;
    const previousGeneric = GenericServer.instance;
    const previousHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    HttpServer.getInstance = () => ({ reload() {} });
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousGeneric;
        HttpServer.getInstance = previousHttp;
    });
    const target = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: [first, second].map(path => path.replace(/\\/g, '/')),
    });
    t.after(() => target.destroy());

    await target.export();
    for (const css of [firstCss, secondCss]) assert.equal(readFileSync(css, 'utf8'), '.site{color:red}');
    writeFileSync(source, '.site { color: blue; }');
    await target.export();
    for (const css of [firstCss, secondCss]) assert.equal(readFileSync(css, 'utf8'), '.site{color:blue}');

    unlinkSync(source);
    await target.export();
    assert.equal(readFileSync(firstCss, 'utf8'), '.site{color:blue}');
    assert.equal(existsSync(secondCss), false);
});
