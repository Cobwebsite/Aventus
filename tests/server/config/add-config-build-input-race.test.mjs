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

test('une section ajoutée pendant la saisie du nom bloque le doublon sur le fichier relu', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-add-build-race-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const initial = { module: 'Demo', build: [], static: [] };
    writeFileSync(path, JSON.stringify(initial));
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    let releaseName;
    const errors = [];
    const notifications = [];
    GenericServer.instance = { connection: {
        Select: async () => ({ label: 'Build' }),
        Input: () => new Promise(resolve => { releaseName = resolve; }),
        showErrorMessage: message => errors.push(message),
        sendNotification: (...args) => notifications.push(args),
    } };

    const pending = Commands.allCommandes['aventus.addConfigSection'].run(uri);
    await Promise.resolve();
    assert.equal(typeof releaseName, 'function');
    const revised = {
        ...initial,
        build: [{ name: 'Shared_App', src: ['other.ts'], compile: [{ output: './dist/other.js' }] }],
    };
    const revisedText = JSON.stringify(revised);
    writeFileSync(path, revisedText);
    releaseName('Shared App');
    await pending;

    assert.equal(readFileSync(path, 'utf8'), revisedText);
    assert.match(errors[0], /already exists/);
    assert.deepEqual(notifications, []);
});
