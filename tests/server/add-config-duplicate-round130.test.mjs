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

test('adding a build section rejects a duplicate name and destination', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-config-duplicate-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    writeFileSync(path, JSON.stringify({ module: 'Demo', build: [], static: [] }));
    const previousServer = GenericServer.instance;
    const notifications = [];
    const errors = [];
    const inputOptions = [];
    GenericServer.instance = { connection: {
        Select: async () => ({ label: 'Build' }),
        Input: async options => { inputOptions.push(options); return 'Shared App'; },
        sendNotification: (...args) => notifications.push(args),
        showErrorMessage: message => errors.push(message),
    } };
    t.after(() => { GenericServer.instance = previousServer; });

    await Commands.allCommandes['aventus.addConfigSection'].run(uri);
    const firstContent = readFileSync(path, 'utf8');
    await Commands.allCommandes['aventus.addConfigSection'].run(uri);

    const config = JSON.parse(readFileSync(path, 'utf8'));
    assert.equal(readFileSync(path, 'utf8'), firstContent);
    assert.equal(config.build.length, 1);
    assert.deepEqual(config.build.map(build => build.name), ['Shared_App']);
    assert.deepEqual(config.build.map(build => build.compile[0].output), [
        './dist/Shared-App.js',
    ]);
    assert.deepEqual(notifications, [['aventus/openfile', [uri]]]);
    assert.match(errors[0], /already exists/);
    assert.equal(inputOptions[1].validations.length, 2);
    assert.equal(new RegExp(inputOptions[1].validations[0].regex).test('!!!'), false);
    assert.equal(new RegExp(inputOptions[1].validations[0].regex).test('Another App'), true);
    assert.equal(new RegExp(inputOptions[1].validations[1].regex).test('Shared App'), false);
    assert.equal(new RegExp(inputOptions[1].validations[1].regex).test('shared-app'), false);
    assert.equal(new RegExp(inputOptions[1].validations[1].regex).test('Another App'), true);
});

test('adding a build section preserves comments in the configuration', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-config-comments-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    writeFileSync(path, '{\n  // project comment\n  "module": "Demo",\n  "build": [\n    // existing build\n    { "name": "First", "compile": [] }\n  ],\n  "static": []\n}');
    const previousServer = GenericServer.instance;
    GenericServer.instance = { connection: {
        Select: async () => ({ label: 'Build' }),
        Input: async () => 'Second',
        sendNotification() {},
    } };
    t.after(() => { GenericServer.instance = previousServer; });

    await Commands.allCommandes['aventus.addConfigSection'].run(uri);
    const content = readFileSync(path, 'utf8');
    assert.match(content, /\/\/ project comment/);
    assert.match(content, /\/\/ existing build/);
    assert.match(content, /"name": "Second"/);
});

test('adding a build section rejects an output path already used by another name', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-config-output-duplicate-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const content = JSON.stringify({
        module: 'Demo',
        build: [{ name: 'Different', compile: [{ output: { '@default': { path: 'dist/Shared-App.js' } } }] }],
        static: [],
    });
    writeFileSync(path, content);
    const previousServer = GenericServer.instance;
    const errors = [];
    const notifications = [];
    GenericServer.instance = { connection: {
        Select: async () => ({ label: 'Build' }),
        Input: async () => 'Shared App',
        showErrorMessage: message => errors.push(message),
        sendNotification: (...args) => notifications.push(args),
    } };
    t.after(() => { GenericServer.instance = previousServer; });

    await Commands.allCommandes['aventus.addConfigSection'].run(uri);
    assert.equal(readFileSync(path, 'utf8'), content);
    assert.match(errors[0], /already exists/);
    assert.deepEqual(notifications, []);
});
