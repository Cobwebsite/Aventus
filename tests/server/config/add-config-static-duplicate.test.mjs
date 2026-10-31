import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'GenericServer.ts',
]);

test('deux ajouts statiques du même nom créent deux entrées identiques', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-duplicate-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    writeFileSync(path, JSON.stringify({ module: 'Demo', build: [], static: [] }));
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    const notifications = [];
    const errors = [];
    GenericServer.instance = { connection: {
        Select: async () => ({ label: 'Static' }),
        Input: async () => 'Assets',
        sendNotification: (...args) => notifications.push(args),
        showErrorMessage: message => errors.push(message),
    } };

    const add = () => Commands.allCommandes['aventus.addConfigSection'].run(uri);
    await add();
    await add();
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')).static, [
        { name: 'Assets', input: '', output: '' },
        { name: 'Assets', input: '', output: '' },
    ]);
    assert.deepEqual(errors, []);
    assert.deepEqual(notifications, [
        ['aventus/openfile', [uri]], ['aventus/openfile', [uri]],
    ]);
});
