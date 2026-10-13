import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'GenericServer.ts',
]);

test('adding two build sections with the same name creates duplicate destinations', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-config-duplicate-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    writeFileSync(path, JSON.stringify({ module: 'Demo', build: [], static: [] }));
    const previousServer = GenericServer.instance;
    const notifications = [];
    GenericServer.instance = { connection: {
        Select: async () => ({ label: 'Build' }),
        Input: async () => 'Shared App',
        sendNotification: (...args) => notifications.push(args),
    } };
    t.after(() => { GenericServer.instance = previousServer; });

    await Commands.allCommandes['aventus.addConfigSection'].run(uri);
    await Commands.allCommandes['aventus.addConfigSection'].run(uri);

    const config = JSON.parse(readFileSync(path, 'utf8'));
    assert.equal(config.build.length, 2);
    assert.deepEqual(config.build.map(build => build.name), ['Shared_App', 'Shared_App']);
    assert.deepEqual(config.build.map(build => build.compile[0].output), [
        './dist/Shared-App.js', './dist/Shared-App.js',
    ]);
    assert.deepEqual(notifications, [
        ['aventus/openfile', [uri]], ['aventus/openfile', [uri]],
    ]);
});
