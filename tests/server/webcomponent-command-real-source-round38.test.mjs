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

async function withComponent(source, compilationResult, run) {
    const uri = `file:///D:/tests/Button-${Math.random().toString(36).slice(2)}.wcl.avt`;
    const file = new InternalAventusFile(TextDocument.create(uri, 'typescript', 1, source));
    const component = Object.create(AventusWebComponentLogicalFile.prototype);
    component._compilationResult = compilationResult;
    const oldFiles = FilesManager.instance;
    const oldServer = GenericServer.instance;
    const notifications = [];
    FilesManager.instance = {
        getByUri: candidate => candidate === uri ? file : undefined,
        getBuild: () => [{ tsFiles: { [uri]: component } }],
    };
    GenericServer.instance = {
        logLevel: 4,
        connection: { sendNotification: (...args) => notifications.push(args) },
    };
    try {
        await run({ uri, file, notifications });
    } finally {
        clearTimeout(file.delayValidate);
        FilesManager.instance = oldFiles;
        GenericServer.instance = oldServer;
    }
}

test('view-element import preserves combined decorators and similarly named component members', async () => {
    const source = '@TagName("demo-button")\nexport class Button {\n    @Attribute()\n    @Property()\n    public titleText!: string;\n\n    protected labelText!: HTMLElement;\n\n}\n';
    const insertion = source.lastIndexOf('\n}\n');
    await withComponent(source, {
        missingViewElements: { position: insertion, elements: { label: 'HTMLSpanElement' } },
    }, async ({ uri, file, notifications }) => {
        await Commands.allCommandes['aventus.wc.import.viewElement'].run(uri, -1);
        assert.match(file.contentUser, /@Attribute\(\)\s+@Property\(\)\s+public titleText!: string;/);
        assert.match(file.contentUser, /protected labelText!: HTMLElement;/);
        assert.match(file.contentUser, /@ViewElement\(\)\s+protected label!: HTMLSpanElement;/);
        assert.equal((file.contentUser.match(/protected label!:/g) ?? []).length, 1);
        assert.equal(notifications.length, 1);
        assert.equal(notifications[0][0], 'aventus/editFile');
        assert.equal(notifications[0][1][0].uri, uri);
    });
});

test('view-method import keeps an existing homonymous method and its references', async () => {
    const source = '@TagName("demo-button")\nexport class Button {\n    @Property()\n    public onClicked!: boolean;\n\n    private onClickedChanged() { return this.onClicked; }\n\n}\n';
    const insertion = source.lastIndexOf('\n}\n');
    await withComponent(source, {
        missingMethods: { position: insertion, elements: ['onClick'] },
    }, async ({ uri, file, notifications }) => {
        await Commands.allCommandes['aventus.wc.import.viewMethod'].run(uri, -1);
        assert.match(file.contentUser, /private onClickedChanged\(\) \{ return this\.onClicked; \}/);
        assert.match(file.contentUser, /protected onClick\(\)/);
        assert.match(file.contentUser, /Method not implemented/);
        assert.equal((file.contentUser.match(/protected onClick\(/g) ?? []).length, 1);
        assert.equal(notifications.length, 1);
        assert.equal(notifications[0][0], 'aventus/editFile');
    });
});
