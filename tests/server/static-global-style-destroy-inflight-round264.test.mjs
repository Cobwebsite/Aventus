import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }, { FilesManager }] =
    await loadServerModules([
        'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts',
        'GenericServer.ts', 'files/FilesManager.ts',
    ]);

test('destroy during global style registration stops pending static publication and a fresh instance can export', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-destroy-style-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'first'), join(root, 'second')];
    mkdirSync(input);
    writeFileSync(join(input, 'site.gs.avt'), ':root { --brand: red; }');

    const previous = {
        settings: SettingsManager.instance,
        server: GenericServer.instance,
        http: HttpServer.getInstance,
        files: FilesManager.instance,
    };
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload: () => reloads++ });
    const project = { scssFiles: {} };
    const added = [];
    let releaseRegistration;
    let registrationStarted;
    const started = new Promise(resolve => registrationStarted = resolve);
    FilesManager.instance = {
        registerFile: async doc => {
            registrationStarted();
            await new Promise(resolve => releaseRegistration = resolve);
            project.scssFiles[doc.uri] = { addOutPath: async (...args) => {
                added.push(args);
                mkdirSync(join(args[0], '..'), { recursive: true });
                writeFileSync(args[0], ':root{--brand:red}');
            } };
        },
    };
    const config = {
        name: 'assets', inputPathFolder: input.replaceAll('\\', '/'),
        outputPathFolder: outputs.map(path => path.replaceAll('\\', '/')),
    };
    const oldExporter = new Static(project, config);
    t.after(() => {
        oldExporter.destroy();
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        HttpServer.getInstance = previous.http;
        FilesManager.instance = previous.files;
    });

    const pending = oldExporter.export();
    await started;
    oldExporter.destroy();
    releaseRegistration();
    await pending;
    assert.deepEqual(added, []);
    assert.equal(reloads, 0);
    assert.equal(oldExporter.exportedBySource.size, 0);

    const newExporter = new Static(project, config);
    t.after(() => newExporter.destroy());
    await newExporter.export();
    assert.deepEqual(added.map(([path, name]) => [path.replaceAll('\\', '/'), name]),
        outputs.map(path => [join(path, 'site.css').replaceAll('\\', '/'), 'assets']));
    assert.equal(reloads, 1);
    assert.equal(newExporter.exportedBySource.size, 1);
});
