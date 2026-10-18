import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('renaming a static SCSS entry to a partial removes CSS and renaming it back recreates both destinations', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-entry-partial-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'first'), join(root, 'second')];
    mkdirSync(input);
    const entry = join(input, 'theme.scss');
    const partial = join(input, '_theme.scss');
    writeFileSync(entry, '.theme { color: red; }');

    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    const oldHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const exporter = new Static({ scssFiles: {} }, {
        name: 'styles', inputPathFolder: input.replaceAll('\\', '/'),
        outputPathFolder: outputs.map(path => path.replaceAll('\\', '/')),
    });
    t.after(() => {
        exporter.destroy();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        HttpServer.getInstance = oldHttp;
    });

    await exporter.export();
    for (const output of outputs) assert.equal(readFileSync(join(output, 'theme.css'), 'utf8'), '.theme{color:red}');

    renameSync(entry, partial);
    await exporter.export();
    for (const output of outputs) {
        assert.equal(existsSync(join(output, 'theme.css')), false);
        assert.equal(existsSync(join(output, '_theme.css')), false);
        assert.equal(existsSync(join(output, '_theme.scss')), false);
    }
    assert.equal(exporter.exportedBySource.size, 0);

    renameSync(partial, entry);
    writeFileSync(entry, '.theme { color: blue; }');
    await exporter.export();
    for (const output of outputs) assert.equal(readFileSync(join(output, 'theme.css'), 'utf8'), '.theme{color:blue}');
    assert.equal(exporter.exportedBySource.size, 1);
    assert.equal(reloads, 3);
});
