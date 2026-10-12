import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { ProjectManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts', 'tools.ts',
]);
const AddI18nValue = Commands.allCommandes['aventus.i18n.add'];

test('i18n add uses the selected translation file, sorts the edit, and revalidates its view and logic', async () => {
    const viewUri = pathToUri('D:\\i18n-round77\\Button.wcv.avt');
    const componentUri = pathToUri('D:\\i18n-round77\\Button.i18n.avt');
    const globalUri = pathToUri('D:\\i18n-round77\\messages.i18n.avt');
    const documentUser = TextDocument.create(componentUri, 'json', 1, '{"z":{"de":"Z"},"a":{"de":"A"}}');
    const calls = [];
    const file = {
        parsedSrc: { z: { de: 'Z' }, a: { de: 'A' } },
        file: { documentUser },
        build: { buildConfig: { i18n: { locales: ['de', 'fr'], fallback: 'de' } } },
    };
    const build = {
        i18nComponentsFiles: { [componentUri]: file },
        tsLanguageService: { i18nFiles: { [globalUri]: file } },
        tsFiles: { [viewUri.replace('.wcv.avt', '.wcl.avt')]: { validate: async () => calls.push('logic') } },
        htmlFiles: { [viewUri]: { validate: async () => calls.push('view') } },
    };
    const previousProject = ProjectManager.instance;
    const previousServer = GenericServer.instance;
    const previousTimeout = globalThis.setTimeout;
    let delayed;
    ProjectManager.instance = { getMatchingBuildsByUri: () => [build] };
    GenericServer.instance = {
        logLevel: 4,
        connection: {
            Select: async items => {
                assert.deepEqual(items.map(item => item.label), ['Button.i18n.avt', 'messages.i18n.avt']);
                return items[0];
            },
            sendNotification: (channel, body) => calls.push([channel, body]),
        },
    };
    globalThis.setTimeout = (callback, delay) => { delayed = [callback, delay]; return 0; };
    try {
        await AddI18nValue.run(viewUri, 'newKey');
        assert.equal(calls.length, 1);
        assert.equal(calls[0][0], 'aventus/editFile');
        assert.equal(calls[0][1][0].uri, componentUri);
        const edit = calls[0][1][0].transformations[0][0];
        assert.equal(documentUser.offsetAt(edit.range.end), documentUser.getText().length);
        const result = JSON.parse(edit.newText);
        assert.deepEqual(Object.keys(result), ['a', 'newKey', 'z']);
        assert.deepEqual(result.newKey, { de: 'newKey', fr: 'ⵌⵌ' });
        assert.equal(delayed[1], 2000);
        await delayed[0]();
        assert.deepEqual(calls.slice(1), ['logic', 'view']);
    } finally {
        ProjectManager.instance = previousProject;
        GenericServer.instance = previousServer;
        globalThis.setTimeout = previousTimeout;
    }
});

test('i18n add skips prompts and edits when no build matches', async () => {
    const previousProject = ProjectManager.instance;
    const previousServer = GenericServer.instance;
    let selections = 0;
    ProjectManager.instance = { getMatchingBuildsByUri: () => [] };
    GenericServer.instance = { logLevel: 4, connection: { Select: async () => { selections++; } } };
    try {
        await AddI18nValue.run('file:///missing.wcv.avt', 'newKey');
        assert.equal(selections, 0);
    } finally {
        ProjectManager.instance = previousProject;
        GenericServer.instance = previousServer;
    }
});
