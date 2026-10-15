import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static SCSS export preserves .scss directories in each output and cleans removed sources', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.static-scss-directory-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'first'), join(root, 'second')];
    mkdirSync(join(input, 'theme.scss'), { recursive: true });
    const source = join(input, 'theme.scss', 'main.scss');
    writeFileSync(source, '.main { color: red; }');

    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    HttpServer.getInstance = () => ({ reload() {} });
    const target = new Static({ scssFiles: {} }, {
        name: 'styles', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: outputs.map(output => output.replace(/\\/g, '/')),
    });
    t.after(() => target.destroy());

    await target.export();
    for (const output of outputs) {
        assert.equal(readFileSync(join(output, 'theme.scss', 'main.css'), 'utf8'), '.main{color:red}');
        assert.equal(existsSync(join(output, 'theme.css', 'main.scss')), false);
    }

    writeFileSync(source, '.main { color: blue; }');
    await target.export();
    for (const output of outputs) {
        assert.equal(readFileSync(join(output, 'theme.scss', 'main.css'), 'utf8'), '.main{color:blue}');
    }
    rmSync(source);
    await target.export();
    for (const output of outputs) {
        assert.equal(existsSync(join(output, 'theme.scss', 'main.css')), false);
    }
});
