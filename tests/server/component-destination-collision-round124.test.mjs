import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [commandsModule, filesModule, serverModule, toolsModule, projectModule] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts', 'project/ProjectManager.ts',
]);
const commands = commandsModule.Commands.allCommandes;
const { FilesManager } = filesModule;
const { GenericServer } = serverModule;
const { ProjectManager } = projectModule;
const { pathToUri, uriToPath } = toolsModule;

function file(uri, text) {
    const documentUser = TextDocument.create(uri, 'text', 1, text);
    return { uri, path: uriToPath(uri), documentUser, contentUser: text, contentInternal: text, versionUser: 1 };
}

async function withFiles(callback) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-conversion-collision-'));
    const previousFiles = FilesManager.getInstance;
    const previousProjects = ProjectManager.getInstance;
    const previousNotify = GenericServer.sendNotification;
    const previousError = GenericServer.showErrorMessage;
    const files = new Map();
    const notifications = [];
    const errors = [];
    FilesManager.getInstance = () => ({
        getByUri: uri => files.get(uri),
        onClose: document => { files.delete(document.uri); },
        registerFile: document => { files.set(document.uri, file(document.uri, document.getText())); },
    });
    ProjectManager.getInstance = () => ({ onRename: async () => ({}) });
    GenericServer.sendNotification = (...args) => notifications.push(args);
    GenericServer.showErrorMessage = message => errors.push(message);
    try { await callback({ root, files, notifications, errors }); }
    finally {
        FilesManager.getInstance = previousFiles;
        ProjectManager.getInstance = previousProjects;
        GenericServer.sendNotification = previousNotify;
        GenericServer.showErrorMessage = previousError;
        rmSync(root, { recursive: true, force: true });
    }
}

test('split overwrites existing three-part files and leaves unrelated folder files', async () => {
    await withFiles(async ({ root, files, notifications, errors }) => {
        const sourcePath = join(root, 'Button.wc.avt');
        const folderPath = join(root, 'Button');
        mkdirSync(folderPath);
        const source = '<script>export class Button {}</script><template><b>new</b></template><style>b { color: red; }</style>';
        writeFileSync(sourcePath, source);
        const sourceUri = pathToUri(sourcePath);
        files.set(sourceUri, file(sourceUri, source));
        const oldPaths = ['Button.wcl.avt', 'Button.wcv.avt', 'Button.wcs.avt'].map(name => join(folderPath, name));
        for (const path of oldPaths) writeFileSync(path, 'old content');
        writeFileSync(join(folderPath, 'notes.txt'), 'preserve');

        await commands['aventus.component.split'].run(sourceUri);

        assert.equal(existsSync(sourcePath), false);
        assert.equal(readFileSync(join(folderPath, 'Button.wcl.avt'), 'utf8'), 'export class Button {}');
        assert.equal(readFileSync(join(folderPath, 'Button.wcv.avt'), 'utf8'), '<b>new</b>');
        assert.equal(readFileSync(join(folderPath, 'Button.wcs.avt'), 'utf8'), 'b { color: red; }');
        assert.equal(readFileSync(join(folderPath, 'notes.txt'), 'utf8'), 'preserve');
        assert.deepEqual(notifications.map(([channel]) => channel), ['aventus/closefile', 'aventus/openfile']);
        assert.deepEqual(errors, []);
    });
});

test('merge overwrites an existing single-file component before removing split sources', async () => {
    await withFiles(async ({ root, files, notifications, errors }) => {
        const folderPath = join(root, 'Button');
        mkdirSync(folderPath);
        const logicPath = join(folderPath, 'Button.wcl.avt');
        const logicUri = pathToUri(logicPath);
        writeFileSync(logicPath, 'export class Button {}');
        files.set(logicUri, file(logicUri, 'export class Button {}'));
        const destinationPath = join(root, 'Button.wc.avt');
        const priorContent = '<script>export class Existing {}</script>';
        writeFileSync(destinationPath, priorContent);

        await commands['aventus.component.merge'].run(logicUri);

        assert.match(readFileSync(destinationPath, 'utf8'), /export class Button/);
        assert.equal(existsSync(logicPath), false);
        assert.equal(existsSync(folderPath), false);
        assert.deepEqual(notifications.map(([channel]) => channel), ['aventus/closefile', 'aventus/openfile']);
        assert.deepEqual(errors, []);
        assert.notEqual(readFileSync(destinationPath, 'utf8'), priorContent);
    });
});
