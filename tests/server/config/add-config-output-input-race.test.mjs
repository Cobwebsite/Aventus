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

test('une sortie ajoutée pendant la saisie bloque le build puis sa correction permet un nouvel essai', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-add-output-race-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    writeFileSync(path, JSON.stringify({ module: 'Demo', build: [], static: [] }));
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    let releaseName;
    let inputCount = 0;
    const errors = [];
    const notifications = [];
    GenericServer.instance = { connection: {
        Select: async () => ({ label: 'Build' }),
        Input: () => ++inputCount === 1 ? new Promise(resolve => { releaseName = resolve; }) : Promise.resolve('Shared App'),
        showErrorMessage: message => errors.push(message),
        sendNotification: (...args) => notifications.push(args),
    } };

    const add = () => Commands.allCommandes['aventus.addConfigSection'].run(uri);
    const pending = add();
    await Promise.resolve();
    assert.equal(typeof releaseName, 'function');
    const revised = {
        module: 'Demo',
        build: [{ name: 'Different', src: [], compile: [{ output: './dist/sub/../Shared-App.js' }] }],
        static: [],
    };
    const conflictingText = JSON.stringify(revised);
    writeFileSync(path, conflictingText);
    releaseName('Shared App');
    await pending;
    assert.equal(readFileSync(path, 'utf8'), conflictingText);
    assert.match(errors[0], /output already exists/);
    assert.deepEqual(notifications, []);

    revised.build[0].compile[0].output = './dist/Different.js';
    writeFileSync(path, JSON.stringify(revised));
    await add();
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')).build, [revised.build[0], {
        name: 'Shared_App', src: [], compile: [{ output: './dist/Shared-App.js' }],
    }]);
    assert.equal(errors.length, 1);
    assert.deepEqual(notifications, [['aventus/openfile', [uri]]]);
});

test('une configuration devenue invalide pendant la saisie reste intacte et accepte un nouvel essai', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-add-invalid-race-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const valid = { module: 'Demo', build: [], static: [] };
    writeFileSync(path, JSON.stringify(valid));
    const previousServer = GenericServer.instance;
    const previousError = console.error;
    t.after(() => {
        GenericServer.instance = previousServer;
        console.error = previousError;
    });
    let releaseName;
    let inputCount = 0;
    const logged = [];
    const notifications = [];
    console.error = error => logged.push(error);
    GenericServer.instance = { connection: {
        Select: async () => ({ label: 'Build' }),
        Input: () => ++inputCount === 1 ? new Promise(resolve => { releaseName = resolve; }) : Promise.resolve('Recovered'),
        sendNotification: (...args) => notifications.push(args),
    } };

    const add = () => Commands.allCommandes['aventus.addConfigSection'].run(uri);
    const pending = add();
    await Promise.resolve();
    assert.equal(typeof releaseName, 'function');
    const broken = '{ "module": "Demo", "build": [ }';
    writeFileSync(path, broken);
    releaseName('Ignored');
    await pending;
    assert.equal(readFileSync(path, 'utf8'), broken);
    assert.equal(logged.length, 1);
    assert.deepEqual(notifications, []);

    writeFileSync(path, JSON.stringify(valid));
    await add();
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')).build, [{
        name: 'Recovered', src: [], compile: [{ output: './dist/Recovered.js' }],
    }]);
    assert.deepEqual(notifications, [['aventus/openfile', [uri]]]);
});
