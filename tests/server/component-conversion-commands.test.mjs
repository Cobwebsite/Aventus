import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [commandsModule, filesModule, serverModule, toolsModule] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts',
    'GenericServer.ts', 'tools.ts',
]);
const SplitComponent = commandsModule.Commands.allCommandes['aventus.component.split'];
const MergeComponent = commandsModule.Commands.allCommandes['aventus.component.merge'];
const { FilesManager } = filesModule;
const { GenericServer } = serverModule;
const { pathToUri } = toolsModule;

async function withFiles(callback) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-component-command-'));
    const originals = { files: FilesManager.getInstance, notify: GenericServer.sendNotification };
    const files = new Map();
    const notifications = [];
    const manager = {
        getByUri: uri => files.get(uri),
        onClose: async document => { files.delete(document.uri); },
        registerFile: async document => { files.set(document.uri, makeFile(document)); },
    };
    FilesManager.getInstance = () => manager;
    GenericServer.sendNotification = (...args) => { notifications.push(args); };
    try {
        await callback({ root, files, notifications });
    } finally {
        FilesManager.getInstance = originals.files;
        GenericServer.sendNotification = originals.notify;
        rmSync(root, { recursive: true, force: true });
    }
}

function makeFile(document) {
    return {
        uri: document.uri,
        path: toolsModule.uriToPath(document.uri),
        documentUser: document,
        contentUser: document.getText(),
        contentInternal: document.getText(),
        versionUser: document.version,
    };
}

test('split component writes three files, updates the registry and reports close/open', async () => {
    await withFiles(async ({ root, files, notifications }) => {
        const path = join(root, 'Button.wc.avt');
        const uri = pathToUri(path);
        const source = '<script>export class Button {}</script><template><div>OK</div></template><style>.button { color: red; }</style>';
        writeFileSync(path, source);
        files.set(uri, makeFile(TextDocument.create(uri, 'Aventus WebComponent', 3, source)));

        await SplitComponent.run(uri);

        assert.equal(existsSync(path), false);
        for (const [extension, expected] of [
            ['wcl.avt', 'export class Button {}'],
            ['wcv.avt', '<div>OK</div>'],
            ['wcs.avt', '.button { color: red; }'],
        ]) {
            const childPath = join(root, 'Button', `Button.${extension}`);
            assert.equal(readFileSync(childPath, 'utf8'), expected);
            assert.equal(files.get(pathToUri(childPath)).versionUser, 4);
        }
        assert.equal(files.has(uri), false);
        assert.deepEqual(notifications.map(([channel]) => channel), ['aventus/closefile', 'aventus/openfile']);
        assert.equal(notifications[0][1], uri);
        assert.equal(notifications[1][1], pathToUri(join(root, 'Button', 'Button.wcl.avt')));
    });
});

test('merge component writes a single file, removes sources and reports close/open', async () => {
    await withFiles(async ({ root, files, notifications }) => {
        const folder = join(root, 'Button');
        mkdirSync(folder);
        for (const [extension, text, version] of [
            ['wcl.avt', 'export class Button {}', 2],
            ['wcv.avt', '<div>OK</div>', 5],
            ['wcs.avt', '.button { color: red; }', 3],
        ]) {
            const path = join(folder, `Button.${extension}`);
            const uri = pathToUri(path);
            writeFileSync(path, text);
            files.set(uri, makeFile(TextDocument.create(uri, 'text', version, text)));
        }

        await MergeComponent.run(pathToUri(join(folder, 'Button.wcl.avt')));

        const mergedPath = join(root, 'Button.wc.avt');
        const merged = readFileSync(mergedPath, 'utf8');
        assert.match(merged, /<script>[\s\S]*export class Button/);
        assert.match(merged, /<template>[\s\S]*<div>OK<\/div>/);
        assert.match(merged, /<style>[\s\S]*\.button \{ color: red; \}/);
        assert.equal(existsSync(folder), false);
        assert.equal(files.get(pathToUri(mergedPath)).versionUser, 6);
        assert.deepEqual(notifications.map(([channel]) => channel), [
            'aventus/closefile', 'aventus/closefile', 'aventus/closefile', 'aventus/openfile',
        ]);
    });
});

test('split and merge ignore absent input', async () => {
    await withFiles(async ({ notifications }) => {
        await SplitComponent.run(undefined);
        await MergeComponent.run(undefined);
        await SplitComponent.run('file:///missing.wc.avt');
        assert.deepEqual(notifications, []);
    });
});
