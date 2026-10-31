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

test('la section statique absente est créée puis complétée sans perdre les commentaires CRLF', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-add-missing-static-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    writeFileSync(path, '{\r\n\t// keep project note\r\n\t"module": "Demo",\r\n\t"build": []\r\n}');
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    const names = ['Images', 'Fonts'];
    const notifications = [];
    GenericServer.instance = { connection: {
        Select: async () => ({ label: 'Static' }),
        Input: async () => names.shift(),
        sendNotification: (...args) => notifications.push(args),
    } };

    const add = () => Commands.allCommandes['aventus.addConfigSection'].run(uri);
    await add();
    let content = readFileSync(path, 'utf8');
    assert.match(content, /\/\/ keep project note/);
    assert.equal(content.replaceAll('\r\n', '').includes('\n'), false);
    assert.deepEqual(JSON.parse(content.replace(/^\s*\/\/.*$/gm, '')), {
        module: 'Demo', build: [], static: [{ name: 'Images', input: '', output: '' }],
    });

    await add();
    content = readFileSync(path, 'utf8');
    assert.match(content, /\/\/ keep project note/);
    assert.equal(content.replaceAll('\r\n', '').includes('\n'), false);
    assert.deepEqual(JSON.parse(content.replace(/^\s*\/\/.*$/gm, '')), {
        module: 'Demo', build: [], static: [
            { name: 'Images', input: '', output: '' },
            { name: 'Fonts', input: '', output: '' },
        ],
    });
    assert.deepEqual(notifications, [
        ['aventus/openfile', [uri]], ['aventus/openfile', [uri]],
    ]);
});
