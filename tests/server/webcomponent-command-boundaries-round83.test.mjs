import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { InternalAventusFile }, { GenericServer }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'files/AventusFile.ts', 'GenericServer.ts',
    'language-services/ts/component/File.ts',
]);

async function fixture(source, build, answers, selected, run) {
    const uri = 'file:///D:/round83/Boundary.wcl.avt';
    const file = new InternalAventusFile(TextDocument.create(uri, 'typescript', 1, source));
    const previousFiles = FilesManager.instance;
    const previousServer = GenericServer.instance;
    const notifications = [];
    let lookups = 0;
    FilesManager.instance = {
        getByUri: requested => { lookups++; return requested === uri ? file : undefined; },
        getBuild: () => build ? [build] : [],
    };
    GenericServer.instance = {
        logLevel: 4,
        connection: {
            Input: async () => answers.shift(),
            Select: async () => selected.shift(),
            sendNotification: (...args) => notifications.push(args),
        },
    };
    try {
        await run({ uri, file, notifications, lookups: () => lookups });
    } finally {
        clearTimeout(file.delayValidate);
        FilesManager.instance = previousFiles;
        GenericServer.instance = previousServer;
    }
}

test('attribute creation retains source outside replacement marker and emits a whole-file edit', async () => {
    const source = 'before\n_\nafter';
    await fixture(source, null, ['count'], [{ label: 'Number', detail: 'number' }], async ({ uri, file, notifications }) => {
        await Commands.allCommandes['aventus.wc.create.attribute'].run(uri, source.indexOf('_'));
        assert.match(file.contentUser, /^before\r?\n/);
        assert.match(file.contentUser, /@Attribute\(\)[\s\S]*public count!:number;/);
        assert.match(file.contentUser, /\r?\nafter$/);
        assert.deepEqual(notifications.map(([method]) => method), ['aventus/editFile']);
        assert.equal(notifications[0][1][0].uri, uri);
    });
});

test('property and watch commands leave the source untouched when no component is registered', async () => {
    for (const [command, answers, selected] of [
        ['aventus.wc.create.property', ['title'], [{ label: 'String', detail: 'string' }, { label: 'No' }]],
        ['aventus.wc.create.watch', ['status', 'number'], [{ label: 'No' }]],
    ]) {
        await fixture('before_after', null, answers, selected, async ({ uri, file, notifications }) => {
            await Commands.allCommandes[command].run(uri, 6, 'prefill');
            assert.equal(file.contentUser, 'before_after');
            assert.deepEqual(notifications, []);
        });
    }
});

test('property and watch generation without callbacks retains type and surrounding source', async () => {
    for (const [command, answers, selected, expected] of [
        ['aventus.wc.create.property', ['title'], [{ label: 'String', detail: 'string' }, { label: 'No' }], /@Property\(\)[\s\S]*public title\?:string;/],
        ['aventus.wc.create.watch', ['status', 'Promise<number>'], [{ label: 'No' }], /@Watch\(\)[\s\S]*public status\?:Promise<number>;/],
    ]) {
        const component = Object.create(AventusWebComponentLogicalFile.prototype);
        component.getComponentName = () => 'Boundary';
        const uri = 'file:///D:/round83/Boundary.wcl.avt';
        await fixture('before_after', { tsFiles: { [uri]: component } }, answers, selected, async ({ uri, file, notifications }) => {
            await Commands.allCommandes[command].run(uri, 6, 'prefill');
            assert.match(file.contentUser, /^before/);
            assert.match(file.contentUser, expected);
            assert.match(file.contentUser, /after$/);
            assert.equal(notifications[0][0], 'aventus/editFile');
        });
    }
});

test('view imports avoid edits for empty or unavailable missing-member data', async () => {
    for (const [command, method] of [
        ['aventus.wc.import.viewElement', 'getMissingVariablesInfo'],
        ['aventus.wc.import.viewMethod', 'getMissingMethodsInfo'],
    ]) {
        for (const info of [{ start: -1, text: 'member' }, { start: 0, text: '' }]) {
            const component = Object.create(AventusWebComponentLogicalFile.prototype);
            component[method] = () => info;
            const uri = 'file:///D:/round83/Boundary.wcl.avt';
            await fixture('before_after', { tsFiles: { [uri]: component } }, [], [], async ({ uri, file, notifications }) => {
                await Commands.allCommandes[command].run(uri, -1);
                assert.equal(file.contentUser, 'before_after');
                assert.deepEqual(notifications, []);
            });
        }
    }
});
