import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static export follows a renamed SCSS entry and revised partial across two destinations', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-scss-rename-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'first'), join(root, 'second')];
    mkdirSync(join(input, 'old'), { recursive: true });
    const partial = join(input, '_palette.scss');
    const oldEntry = join(input, 'old', 'theme.scss');
    const newEntry = join(input, 'theme.scss');
    writeFileSync(partial, '$tone: red;');
    writeFileSync(oldEntry, '@use "../palette"; .theme { color: palette.$tone; }');

    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    const oldHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const exporter = new Static({ scssFiles: {} }, {
        name: 'styles', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: outputs.map(path => path.replace(/\\/g, '/')),
    });
    t.after(() => {
        exporter.destroy();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        HttpServer.getInstance = oldHttp;
    });

    await exporter.export();
    for (const output of outputs) {
        assert.equal(readFileSync(join(output, 'old', 'theme.css'), 'utf8'), '.theme{color:red}');
        assert.equal(existsSync(join(output, '_palette.css')), false);
    }

    renameSync(oldEntry, newEntry);
    writeFileSync(newEntry, '@use "palette"; .theme { color: palette.$tone; }');
    writeFileSync(partial, '$tone: blue;');
    await exporter.export();
    for (const output of outputs) {
        assert.equal(existsSync(join(output, 'old', 'theme.css')), false);
        assert.equal(readFileSync(join(output, 'theme.css'), 'utf8'), '.theme{color:blue}');
        assert.equal(existsSync(join(output, '_palette.css')), false);
    }

    rmSync(newEntry);
    await exporter.export();
    for (const output of outputs) assert.equal(existsSync(join(output, 'theme.css')), false);
    assert.equal(exporter.exportedBySource.size, 0); // The partial remains an input without an output.
    assert.equal(reloads, 3);
});
