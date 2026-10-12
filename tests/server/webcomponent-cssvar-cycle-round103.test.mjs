import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { InternalAventusFile }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'files/AventusFile.ts', 'GenericServer.ts',
]);

test('successive CSS variable commands preserve surrounding style and replace only the chosen marker', async t => {
    const uri = 'file:///D:/round103/FancyButton.wcs.avt';
    const initial = '.button {\n  color: red;\n  _\n  border: 0;\n}\n';
    const file = new InternalAventusFile(TextDocument.create(uri, 'scss', 1, initial));
    const previousServer = GenericServer.instance;
    const previousFiles = FilesManager.instance;
    const notifications = [];
    const answers = ['PrimaryColor', '#fff', 'SecondaryColor', '#000'];
    GenericServer.instance = {
        logLevel: 4,
        connection: {
            Input: async () => answers.shift(),
            sendNotification: (...args) => notifications.push(args),
        },
    };
    FilesManager.instance = { getByUri: candidate => candidate === uri ? file : undefined };
    t.after(() => {
        clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        FilesManager.instance = previousFiles;
    });

    await Commands.allCommandes['aventus.wc.create.cssvar'].run(uri, initial.indexOf('_'));
    assert.match(file.contentUser, /--_fancy-button-primary-color: var\(--fancy-button-primary-color, #fff\);/);
    const next = file.contentUser.replace('  border: 0;', '  _\n  border: 0;');
    await file.triggerContentChange(TextDocument.create(uri, 'scss', file.versionUser + 1, next));
    await Commands.allCommandes['aventus.wc.create.cssvar'].run(uri, next.indexOf('_', next.indexOf('primary-color') + 1));

    assert.equal((file.contentUser.match(/--_fancy-button-primary-color:/g) ?? []).length, 1);
    assert.equal((file.contentUser.match(/--_fancy-button-secondary-color:/g) ?? []).length, 1);
    assert.match(file.contentUser, /color: red;/);
    assert.match(file.contentUser, /border: 0;/);
    assert.deepEqual(notifications.map(([method]) => method), ['aventus/editFile', 'aventus/editFile']);
    assert.ok(notifications.every(([, edits]) => edits[0].uri === uri));
});
