import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { InternalAventusFile }, { GenericServer }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'files/AventusFile.ts', 'GenericServer.ts',
    'language-services/ts/component/File.ts',
]);

async function withBuilds(builds, answers, selections, run) {
    const uri = 'file:///D:/round111/Widget.wcl.avt';
    const file = new InternalAventusFile(TextDocument.create(uri, 'typescript', 1, 'before_after'));
    const previousFiles = FilesManager.instance;
    const previousServer = GenericServer.instance;
    const notifications = [];
    FilesManager.instance = {
        getByUri: requested => requested === uri ? file : undefined,
        getBuild: () => builds,
    };
    GenericServer.instance = {
        logLevel: 4,
        connection: {
            Input: async () => answers.shift(),
            Select: async () => selections.shift(),
            sendNotification: (...args) => notifications.push(args),
        },
    };
    try {
        await run({ uri, file, notifications });
    } finally {
        clearTimeout(file.delayValidate);
        FilesManager.instance = previousFiles;
        GenericServer.instance = previousServer;
    }
}

function component(name = 'Widget') {
    const result = Object.create(AventusWebComponentLogicalFile.prototype);
    result.getComponentName = () => name;
    return result;
}

test('watch callback uses Aventus.WatchAction outside a core build and preserves adjacent source', async () => {
    const uri = 'file:///D:/round111/Widget.wcl.avt';
    await withBuilds([{ tsFiles: { [uri]: component() }, isCoreBuild: false }], ['state', 'Map<string, number>'], [{ label: 'Yes' }], async ({ uri, file, notifications }) => {
        await Commands.allCommandes['aventus.wc.create.watch'].run(uri, 6, 'state');
        assert.match(file.contentUser, /^before/);
        assert.match(file.contentUser, /@Watch\(\(target: Widget, action: Aventus\.WatchAction, path: string, value: any\) =>/);
        assert.match(file.contentUser, /public state\?:Map<string, number>;/);
        assert.match(file.contentUser, /after$/);
        assert.deepEqual(notifications.map(([method]) => method), ['aventus/editFile']);
    });
});

test('property and watch use the later build when it contains the component', async () => {
    const uri = 'file:///D:/round111/Widget.wcl.avt';
    const builds = [{ tsFiles: {} }, { tsFiles: { [uri]: component() }, isCoreBuild: false }];
    for (const [command, answers, selections] of [
        ['aventus.wc.create.property', ['title'], [{ label: 'String', detail: 'string' }, { label: 'No' }]],
        ['aventus.wc.create.watch', ['state', 'number'], [{ label: 'No' }]],
    ]) {
        await withBuilds(builds, answers, selections, async ({ uri, file, notifications }) => {
            await Commands.allCommandes[command].run(uri, 6, 'prefill');
            assert.match(file.contentUser, command.endsWith('property') ? /public title\?:string;/ : /public state\?:number;/);
            assert.deepEqual(notifications.map(([method]) => method), ['aventus/editFile']);
        });
    }
});

test('watch callback uses the core build that contains the component', async () => {
    const uri = 'file:///D:/round111/Widget.wcl.avt';
    const builds = [{ tsFiles: {}, isCoreBuild: false }, { tsFiles: { [uri]: component() }, isCoreBuild: true }];
    await withBuilds(builds, ['state', 'number'], [{ label: 'Yes' }], async ({ uri, file }) => {
        await Commands.allCommandes['aventus.wc.create.watch'].run(uri, 6, 'state');
        assert.match(file.contentUser, /action: WatchAction/);
        assert.doesNotMatch(file.contentUser, /action: Aventus\.WatchAction/);
    });
});
