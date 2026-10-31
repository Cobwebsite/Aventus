import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { loadServerModules } from '../helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const { parse } = require('jsonc-parser');
const [{ Commands }, { GenericServer }] = await loadServerModules(['cmds/index.ts', 'GenericServer.ts']);

test('add config appends build and static sections to JSONC with trailing commas', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-add-jsonc-trailing-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    writeFileSync(path, '{\r\n\t// keep this note\r\n\t"module": "Demo",\r\n\t"build": [],\r\n\t"static": [],\r\n}');

    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    const selected = ['Build', 'Static'];
    const notifications = [];
    GenericServer.instance = { connection: {
        Select: async () => ({ label: selected.shift() }),
        Input: async () => 'Shared assets',
        sendNotification: (...args) => notifications.push(args),
    } };

    const add = () => Commands.allCommandes['aventus.addConfigSection'].run(uri);
    await add();
    await add();

    const content = readFileSync(path, 'utf8');
    const errors = [];
    assert.deepEqual(parse(content, errors, { allowTrailingComma: true }), {
        module: 'Demo',
        build: [{ name: 'Shared_assets', src: [], compile: [{ output: './dist/Shared-assets.js' }] }],
        static: [{ name: 'Shared assets', input: '', output: '' }],
    });
    assert.deepEqual(errors, []);
    assert.match(content, /\/\/ keep this note/);
    assert.equal(content.replaceAll('\r\n', '').includes('\n'), false);
    assert.deepEqual(notifications, [
        ['aventus/openfile', [uri]], ['aventus/openfile', [uri]],
    ]);
});
