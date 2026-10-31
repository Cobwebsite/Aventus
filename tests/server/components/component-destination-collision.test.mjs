import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

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

test('split refuses existing three-part files without changing source or destinations', async () => {
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

        assert.equal(readFileSync(sourcePath, 'utf8'), source);
        for (const path of oldPaths) assert.equal(readFileSync(path, 'utf8'), 'old content');
        assert.equal(readFileSync(join(folderPath, 'notes.txt'), 'utf8'), 'preserve');
        assert.deepEqual(notifications, []);
        assert.deepEqual([...files.keys()], [sourceUri]);
        assert.equal(errors.length, 1);
        assert.ok(errors[0].includes(`destination already exists: ${uriToPath(pathToUri(oldPaths[2]))}`));
    });
});

test('merge refuses an existing single-file component before removing sources', async () => {
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

        assert.equal(readFileSync(destinationPath, 'utf8'), priorContent);
        assert.equal(readFileSync(logicPath, 'utf8'), 'export class Button {}');
        assert.equal(existsSync(folderPath), true);
        assert.deepEqual(notifications, []);
        assert.deepEqual([...files.keys()], [logicUri]);
        assert.equal(errors.length, 1);
        assert.match(errors[0], /Button\.wc\.avt/);
    });
});

test('split and merge also refuse destinations present only in the file cache', async () => {
    await withFiles(async ({ root, files, notifications, errors }) => {
        const sourcePath = join(root, 'Button.wc.avt');
        const sourceUri = pathToUri(sourcePath);
        const source = '<script>export class Button {}</script>';
        writeFileSync(sourcePath, source);
        files.set(sourceUri, file(sourceUri, source));
        const styleUri = pathToUri(join(root, 'Button', 'Button.wcs.avt'));
        files.set(styleUri, file(styleUri, 'unsaved style'));

        await commands['aventus.component.split'].run(sourceUri);
        assert.equal(readFileSync(sourcePath, 'utf8'), source);
        assert.equal(existsSync(join(root, 'Button')), false);
        assert.equal(files.get(styleUri).contentUser, 'unsaved style');

        files.delete(styleUri);
        const folderPath = join(root, 'Button');
        mkdirSync(folderPath);
        const logicPath = join(folderPath, 'Button.wcl.avt');
        const logicUri = pathToUri(logicPath);
        writeFileSync(logicPath, 'export class Button {}');
        files.set(logicUri, file(logicUri, 'export class Button {}'));
        rmSync(sourcePath);

        await commands['aventus.component.merge'].run(logicUri);
        assert.equal(readFileSync(logicPath, 'utf8'), 'export class Button {}');
        assert.equal(existsSync(sourcePath), false);
        assert.deepEqual(notifications, []);
        assert.equal(errors.length, 2);
        assert.ok(errors[0].includes(`destination already exists: ${uriToPath(styleUri)}`));
        assert.match(errors[1], /Button\.wc\.avt/);
    });
});
