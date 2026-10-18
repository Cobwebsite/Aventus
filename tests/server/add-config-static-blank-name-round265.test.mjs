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

test('un nom statique vide annule mais un nom composé uniquement d espaces est ajouté', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-blank-name-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const initial = JSON.stringify({ module: 'Demo', build: [], static: [] });
    writeFileSync(path, initial);
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    const names = ['', '   '];
    const notifications = [];
    GenericServer.instance = { connection: {
        Select: async () => ({ label: 'Static' }),
        Input: async () => names.shift(),
        sendNotification: (...args) => notifications.push(args),
    } };

    const add = () => Commands.allCommandes['aventus.addConfigSection'].run(uri);
    await add();
    assert.equal(readFileSync(path, 'utf8'), initial);
    assert.deepEqual(notifications, []);

    await add();
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')).static, [
        { name: '   ', input: '', output: '' },
    ]);
    assert.deepEqual(notifications, [['aventus/openfile', [uri]]]);
});
