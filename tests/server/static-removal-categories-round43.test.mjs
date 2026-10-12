import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Static }, { SettingsManager }, { HttpServer }, { GenericServer }, { FilesManager }] =
    await loadServerModules([
        'project/Static.ts', 'settings/Settings.ts', 'live-server/HttpServer.ts',
        'GenericServer.ts', 'files/FilesManager.ts',
    ]);

test('static reexport refreshes surviving resources and removes deleted binary, SCSS and global-style outputs', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.static-removal-categories-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'input');
    const outputs = [join(root, 'out-one'), join(root, 'out-two')];
    mkdirSync(join(input, 'nested'), { recursive: true });
    SettingsManager.instance = { settings: { watchFiles: false, useStats: false } };
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    let reloads = 0;
    HttpServer.getInstance = () => ({ reload() { reloads++; } });
    const project = { scssFiles: {} };
    const pathsAdded = [];
    const pathsRemoved = [];
    FilesManager.instance = {
        async registerFile(doc) {
            project.scssFiles[doc.uri] = {
                async addOutPath(path, name) {
                    pathsAdded.push([path, name]);
                    writeFileSync(path, 'global-css');
                },
                removeOutPath(path) { pathsRemoved.push(path); },
            };
        },
    };
    const target = new Static(project, {
        name: 'assets',
        inputPathFolder: input.replace(/\\/g, '/'),
        outputPathFolder: outputs.map(path => path.replace(/\\/g, '/')),
    });
    t.after(() => target.destroy());

    const removed = ['nested/icon.bin', 'nested/theme.scss', 'nested/palette.gs.avt'];
    writeFileSync(join(input, removed[0]), Buffer.from([0, 255, 7]));
    writeFileSync(join(input, removed[1]), '.theme { color: red; }');
    writeFileSync(join(input, removed[2]), ':root { --tone: red; }');
    writeFileSync(join(input, 'nested', 'retained.txt'), 'first');
    await target.export();

    for (const relative of removed) unlinkSync(join(input, relative));
    writeFileSync(join(input, 'nested', 'retained.txt'), 'second');
    await target.export();

    for (const output of outputs) {
        assert.equal(existsSync(join(output, removed[0])), false);
        assert.equal(existsSync(join(output, 'nested', 'theme.css')), false);
        assert.equal(existsSync(join(output, 'nested', 'palette.css')), false);
        assert.equal(readFileSync(join(output, 'nested', 'retained.txt'), 'utf8'), 'second');
        assert.equal(existsSync(join(output, removed[1])), false);
        assert.equal(existsSync(join(output, removed[2])), false);
    }
    assert.equal(pathsAdded.length, 2);
    assert.deepEqual(pathsAdded.map(([path]) => path), outputs.map(output => join(output, 'nested', 'palette.css').replace(/\\/g, '/')));
    assert.deepEqual(pathsRemoved.map(path => path.replace(/\\/g, '/')), pathsAdded.map(([path]) => path));
    assert.equal(reloads, 2);
});
