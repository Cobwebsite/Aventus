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

test('un chemin de sortie normalisé bloque un doublon puis la commande réussit après correction', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-add-config-path-round248-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const original = {
        module: 'Demo',
        build: [{ name: 'Existing', src: [], compile: [{ output: './dist/sub/../Shared-App.js' }] }],
        static: [],
    };
    writeFileSync(path, JSON.stringify(original));
    const previous = GenericServer.instance;
    const errors = [];
    const notifications = [];
    GenericServer.instance = { connection: {
        Select: async () => ({ label: 'Build' }),
        Input: async () => 'Shared App',
        showErrorMessage: message => errors.push(message),
        sendNotification: (...args) => notifications.push(args),
    } };
    t.after(() => { GenericServer.instance = previous; });

    const add = () => Commands.allCommandes['aventus.addConfigSection'].run(uri);
    await add();
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), original);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /output already exists/);
    assert.deepEqual(notifications, []);

    original.build[0].compile[0].output = './dist/Other.js';
    writeFileSync(path, JSON.stringify(original));
    await add();
    assert.equal(errors.length, 1);
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')).build, [original.build[0], {
        name: 'Shared_App', src: [], compile: [{ output: './dist/Shared-App.js' }],
    }]);
    assert.deepEqual(notifications, [['aventus/openfile', [uri]]]);
});
