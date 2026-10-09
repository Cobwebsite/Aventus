import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [commandsModule, projectsModule, serverModule, toolsModule, serviceModule] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts', 'tools.ts',
    'language-services/i18n/LanguageService.ts',
]);
const { ProjectManager } = projectsModule;
const { GenericServer } = serverModule;
const { pathToUri } = toolsModule;
const { AventusI18nLanguageService } = serviceModule;
const add = commandsModule.Commands.allCommandes['aventus.i18n.add'];

function fixture() {
    const viewUri = pathToUri('D:\\demo\\Button.wcv.avt');
    const componentUri = pathToUri('D:\\demo\\Button.i18n.avt');
    const globalUri = pathToUri('D:\\demo\\messages.i18n.avt');
    function file(uri, translations) {
        const doc = TextDocument.create(uri, 'json', 3, JSON.stringify(translations));
        return {
            parsedSrc: translations,
            file: { documentUser: doc },
            build: { buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } } },
        };
    }
    const build = {
        i18nComponentsFiles: { [componentUri]: file(componentUri, { existing: { en: 'Existing', fr: 'Existant' } }) },
        tsLanguageService: { i18nFiles: { [globalUri]: file(globalUri, {}) } },
        tsFiles: {}, htmlFiles: {},
    };
    return { viewUri, componentUri, globalUri, build };
}

async function withI18n(run) {
    const oldProject = ProjectManager.getInstance;
    const oldServer = GenericServer.instance;
    const oldTimeout = globalThis.setTimeout;
    const state = fixture();
    const prompts = [];
    const notifications = [];
    const delayed = [];
    let selected = null;
    ProjectManager.getInstance = () => ({ getMatchingBuildsByUri: () => [state.build] });
    GenericServer.instance = {
        logLevel: 4,
        connection: {
            Select: async (items, options) => { prompts.push([items, options]); return selected; },
            sendNotification: (...args) => notifications.push(args),
        },
    };
    globalThis.setTimeout = (callback, delay) => { delayed.push([callback, delay]); return 0; };
    try {
        await run({ ...state, prompts, notifications, delayed, setSelected: value => { selected = value; } });
    } finally {
        globalThis.setTimeout = oldTimeout;
        ProjectManager.getInstance = oldProject;
        GenericServer.instance = oldServer;
    }
}

test('i18n add offers component and global files and emits a complete edit', async () => {
    await withI18n(async ({ viewUri, componentUri, globalUri, prompts, notifications, delayed, setSelected }) => {
        setSelected({ label: 'Button.i18n.avt', detail: 'D:\\demo\\Button.i18n.avt' });
        await add.run(viewUri, 'hello');
        assert.deepEqual(prompts[0][0].map(item => item.label), ['Button.i18n.avt', 'messages.i18n.avt']);
        assert.equal(prompts[0][1].title, 'Where should I insert the transalation?');
        assert.equal(notifications.length, 1);
        assert.equal(notifications[0][0], 'aventus/editFile');
        const edit = notifications[0][1][0];
        assert.equal(edit.uri, componentUri);
        const replacement = JSON.parse(edit.transformations[0][0].newText);
        assert.deepEqual(replacement, {
            existing: { en: 'Existing', fr: 'Existant' },
            hello: { en: 'hello', fr: AventusI18nLanguageService.empty },
        });
        assert.equal(delayed[0][1], 2000);
        assert.equal(globalUri in replacement, false);
    });
});

test('i18n add without component option offers only global files and respects cancellation', async () => {
    await withI18n(async ({ viewUri, prompts, notifications, delayed }) => {
        await add.run(viewUri, 'hello', false);
        assert.deepEqual(prompts[0][0].map(item => item.label), ['messages.i18n.avt']);
        assert.deepEqual(notifications, []);
        assert.deepEqual(delayed, []);
    });
});
