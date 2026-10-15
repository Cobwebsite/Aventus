import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'GenericServer.ts',
]);

test('add build section ignores a name normalized to empty, then succeeds on retry', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-config-build-name-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const original = JSON.stringify({ module: 'Demo', build: [], static: [], custom: { keep: true } }, null, 2);
    writeFileSync(path, original);

    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    const notifications = [];
    const inputs = ['   !!!   ', '  New Widget  '];
    GenericServer.instance = { connection: {
        Select: async () => ({ label: 'Build' }),
        Input: async () => inputs.shift(),
        sendNotification: (...args) => notifications.push(args),
    } };

    await Commands.allCommandes['aventus.addConfigSection'].run(uri);
    assert.equal(readFileSync(path, 'utf8'), original);
    assert.deepEqual(notifications, []);

    await Commands.allCommandes['aventus.addConfigSection'].run(uri);
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), {
        module: 'Demo',
        build: [{ name: 'New_Widget', src: [], compile: [{ output: './dist/New-Widget.js' }] }],
        static: [],
        custom: { keep: true },
    });
    assert.deepEqual(notifications, [['aventus/openfile', [uri]]]);
    assert.deepEqual(inputs, []);
});
