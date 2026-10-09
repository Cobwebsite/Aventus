import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [commandsModule, filesModule, fileModule, serverModule, componentModule] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'files/AventusFile.ts', 'GenericServer.ts',
    'language-services/ts/component/File.ts',
]);
const { Commands } = commandsModule;
const { FilesManager } = filesModule;
const { InternalAventusFile } = fileModule;
const { GenericServer } = serverModule;
const { AventusWebComponentLogicalFile } = componentModule;

async function withCommandFile(uri, inputAnswers, selectAnswers, run, build) {
    const file = new InternalAventusFile(TextDocument.create(uri, 'typescript', 1, '_'));
    const oldFiles = FilesManager.instance;
    const oldServer = GenericServer.instance;
    const sent = [];
    const prompts = [];
    FilesManager.instance = {
        getByUri: requested => requested === uri ? file : undefined,
        getBuild: () => build ? [build] : [],
    };
    GenericServer.instance = {
        logLevel: 4,
        connection: {
            Input: async options => { prompts.push(options); return inputAnswers.shift(); },
            Select: async () => Array.isArray(selectAnswers) ? selectAnswers.shift() : selectAnswers,
            sendNotification: (...args) => sent.push(args),
        },
    };
    try {
        await run(file, sent, prompts);
    } finally {
        clearTimeout(file.delayValidate);
        FilesManager.instance = oldFiles;
        GenericServer.instance = oldServer;
    }
}

test('create attribute inserts the selected type and sends an edit notification', async () => {
    const uri = 'file:///d%3A/work/Button.wcl.avt';
    await withCommandFile(uri, ['size'], { label: 'Number', detail: 'number' }, async (file, sent, prompts) => {
        await Commands.allCommandes['aventus.wc.create.attribute'].run(uri, 0);
        assert.match(file.contentUser, /@Attribute\(\)/);
        assert.match(file.contentUser, /public size!:number;/);
        assert.equal(prompts[0].title, 'Provide a name for your Attribute');
        assert.equal(sent[0][0], 'aventus/editFile');
        assert.equal(sent[0][1][0].uri, uri);
    });
});

test('create property inserts a typed decorator with an optional callback', async () => {
    const uri = 'file:///d%3A/work/Button.wcl.avt';
    const component = Object.create(AventusWebComponentLogicalFile.prototype);
    component.getComponentName = () => 'Button';
    const build = { tsFiles: { [uri]: component } };
    await withCommandFile(uri, ['title'], [
        { label: 'String', detail: 'string' }, { label: 'Yes' },
    ], async (file, sent, prompts) => {
        await Commands.allCommandes['aventus.wc.create.property'].run(uri, 0, 'title');
        assert.match(file.contentUser, /@Property\(\(target: Button\) =>/);
        assert.match(file.contentUser, /public title\?:string;/);
        assert.equal(prompts[0].value, 'title');
        assert.equal(sent[0][0], 'aventus/editFile');
    }, build);
});

test('create watch uses the core build callback signature', async () => {
    const uri = 'file:///d%3A/work/Button.wcl.avt';
    const component = Object.create(AventusWebComponentLogicalFile.prototype);
    component.getComponentName = () => 'Button';
    const build = { tsFiles: { [uri]: component }, isCoreBuild: true };
    await withCommandFile(uri, ['status', 'number'], [{ label: 'Yes' }], async (file, sent) => {
        await Commands.allCommandes['aventus.wc.create.watch'].run(uri, 0, 'status');
        assert.match(file.contentUser, /@Watch\(\(target: Button, action: WatchAction, path: string, value: any\) =>/);
        assert.match(file.contentUser, /public status\?:number;/);
        assert.equal(sent[0][0], 'aventus/editFile');
    }, build);
});

test('create CSS variable uses the file and variable names and optional default value', async () => {
    const uri = 'file:///d%3A/work/FancyButton.wcs.avt';
    await withCommandFile(uri, ['PrimaryColor', '#fff'], undefined, async (file, sent) => {
        await Commands.allCommandes['aventus.wc.create.cssvar'].run(uri, 0);
        assert.equal(file.contentUser, '--_fancy-button-primary-color: var(--fancy-button-primary-color, #fff);');
        assert.equal(sent[0][0], 'aventus/editFile');
    });
});

test('create attribute stops after canceled name or type selection', async () => {
    const uri = 'file:///d%3A/work/Button.wcl.avt';
    await withCommandFile(uri, [null], undefined, async (file, sent) => {
        await Commands.allCommandes['aventus.wc.create.attribute'].run(uri, 0);
        assert.equal(file.contentUser, '_');
        assert.deepEqual(sent, []);
    });
    await withCommandFile(uri, ['size'], null, async (file, sent) => {
        await Commands.allCommandes['aventus.wc.create.attribute'].run(uri, 0);
        assert.equal(file.contentUser, '_');
        assert.deepEqual(sent, []);
    });
});

test('view import commands insert missing variables and methods at their reported positions', async () => {
    const cases = [
        ['aventus.wc.import.viewElement', 'getMissingVariablesInfo', 'private label!: HTMLElement;'],
        ['aventus.wc.import.viewMethod', 'getMissingMethodsInfo', 'private onClick() {}'],
    ];
    for (const [command, method, generated] of cases) {
        const uri = 'file:///d%3A/work/Button.wcl.avt';
        const component = Object.create(AventusWebComponentLogicalFile.prototype);
        component[method] = () => ({ start: 0, text: generated });
        const build = { tsFiles: { [uri]: component } };
        await withCommandFile(uri, [], undefined, async (file, sent) => {
            await Commands.allCommandes[command].run(uri, -1);
            assert.equal(file.contentUser, generated);
            assert.equal(sent[0][0], 'aventus/editFile');
        }, build);
    }
});
