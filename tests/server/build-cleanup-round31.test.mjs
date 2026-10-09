import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { NpmBuilder }, { SettingsManager }, { HttpServer }, { GenericServer }] = await loadServerModules([
    'project/Static.ts', 'project/BuildNpm.ts', 'settings/Settings.ts',
    'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('static re-export after removing nested assets and SCSS refreshes survivors in both destinations', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.build-cleanup-static-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'out-one'), join(root, 'out-two')];
    mkdirSync(join(input, 'assets'), { recursive: true });
    mkdirSync(join(input, 'styles'), { recursive: true });
    const removedAsset = join(input, 'assets', 'removed.svg');
    const retainedAsset = join(input, 'assets', 'retained.json');
    const removedStyle = join(input, 'styles', 'removed.scss');
    const retainedStyle = join(input, 'styles', 'retained.scss');
    writeFileSync(removedAsset, '<svg>old</svg>');
    writeFileSync(retainedAsset, '{"version":1}');
    writeFileSync(removedStyle, '.removed { color: red; }');
    writeFileSync(retainedStyle, '.retained { color: red; }');
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    const previousGetHttp = HttpServer.getInstance;
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const target = new Static({ scssFiles: {} }, {
        name: 'assets', inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: outputs.map(path => path.replace(/\\/g, '/')),
    });
    t.after(() => {
        target.destroy();
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        HttpServer.getInstance = previousGetHttp;
    });

    await target.export();
    for (const output of outputs) {
        assert.equal(readFileSync(join(output, 'assets', 'removed.svg'), 'utf8'), '<svg>old</svg>');
        assert.equal(readFileSync(join(output, 'styles', 'removed.css'), 'utf8'), '.removed{color:red}');
    }
    unlinkSync(removedAsset);
    unlinkSync(removedStyle);
    writeFileSync(retainedAsset, '{"version":2}');
    writeFileSync(retainedStyle, '.retained { color: blue; }');
    await target.export();
    for (const output of outputs) {
        assert.equal(readFileSync(join(output, 'assets', 'retained.json'), 'utf8'), '{"version":2}');
        assert.equal(readFileSync(join(output, 'styles', 'retained.css'), 'utf8'), '.retained{color:blue}');
        // Characterize the already documented absence of obsolete-output cleanup.
        assert.equal(existsSync(join(output, 'assets', 'removed.svg')), true);
        assert.equal(existsSync(join(output, 'styles', 'removed.css')), true);
    }
    assert.equal(reloads, 2);
});

test('npm recompilation removes one real module from the bundle and keeps another executable', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.build-cleanup-npm-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const nodeModulesDir = join(root, 'node_modules');
    for (const [name, value] of [['first-fixture', 41], ['second-fixture', 73]]) {
        const folder = join(nodeModulesDir, name);
        mkdirSync(folder, { recursive: true });
        writeFileSync(join(folder, 'package.json'), JSON.stringify({ name, version: '1.0.0', main: 'index.js' }));
        writeFileSync(join(folder, 'index.js'), `exports.value = ${value};\n`);
    }
    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = previousServer; });
    const builder = new NpmBuilder({ isBuildAllowed: true, nodeModulesDir, fullname: 'CleanupFixture' });
    builder.register('file:///first.lib.avt', { uri: 'first-fixture', libName: 'value', alias: 'first' });
    builder.register('file:///second.lib.avt', { uri: 'second-fixture', libName: 'value', alias: 'second' });
    const initial = await builder.compile();
    assert.deepEqual(initial.errors, []);
    assert.match(initial.result, /first/);
    assert.match(initial.result, /second/);
    builder.unregister('file:///first.lib.avt');
    const updated = await builder.compile();
    assert.deepEqual(updated.errors, []);
    assert.doesNotMatch(updated.result, /first-fixture|\['first'\]|41/);
    assert.match(updated.result, /second/);
    assert.match(updated.result, /73/);
    const namespace = runInNewContext(`${updated.result}\nnpmCompilation`);
    assert.equal(Object.keys(namespace).length, 1);
    assert.equal(Object.values(namespace)[0].second, 73);
});
