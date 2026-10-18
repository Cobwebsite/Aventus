import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static SCSS partial becomes an entry then a partial again across two destinations', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-partial-entry-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'owned'), join(root, 'preexisting')];
    mkdirSync(input);
    mkdirSync(outputs[1]);
    const partial = join(input, '_theme.scss');
    const entry = join(input, 'theme.scss');
    const css = outputs.map(output => join(output, 'theme.css'));
    writeFileSync(partial, '.theme { color: red; }');
    writeFileSync(css[1], 'foreign');

    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    const oldHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const exporter = new Static({ scssFiles: {} }, {
        name: 'styles', inputPathFolder: input.replaceAll('\\', '/'),
        outputPathFolder: outputs.map(output => output.replaceAll('\\', '/')),
    });
    t.after(() => {
        exporter.destroy();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        HttpServer.getInstance = oldHttp;
    });

    await exporter.export();
    assert.equal(existsSync(css[0]), false);
    assert.equal(readFileSync(css[1], 'utf8'), 'foreign');
    assert.equal(exporter.exportedBySource.size, 0);

    renameSync(partial, entry);
    await exporter.export();
    for (const file of css) assert.equal(readFileSync(file, 'utf8'), '.theme{color:red}');
    assert.equal(exporter.exportedBySource.size, 1);

    renameSync(entry, partial);
    await exporter.export();
    assert.equal(existsSync(css[0]), false);
    assert.equal(readFileSync(css[1], 'utf8'), '.theme{color:red}');
    assert.equal(exporter.exportedBySource.size, 0);

    writeFileSync(partial, '.theme { color: blue; }');
    renameSync(partial, entry);
    await exporter.export();
    for (const file of css) assert.equal(readFileSync(file, 'utf8'), '.theme{color:blue}');
    assert.equal(reloads, 4);
});
