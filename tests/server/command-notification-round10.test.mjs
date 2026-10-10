import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [commandsModule, serverModule, inputModule, selectModule, multiModule, popupModule, filesModule, fileModule, projectModule, toolsModule] = await loadServerModules([
    'cmds/index.ts', 'GenericServer.ts', 'notification/AskInput.ts',
    'notification/AskSelect.ts', 'notification/AskSelectMultiple.ts',
    'notification/Popup.ts', 'files/FilesManager.ts', 'files/AventusFile.ts',
    'project/ProjectManager.ts', 'tools.ts',
]);
const commands = commandsModule.Commands.allCommandes;
const { GenericServer } = serverModule;
const { AskInput } = inputModule;
const { AskSelect } = selectModule;
const { AskSelectMultiple } = multiModule;
const { Popup } = popupModule;
const { FilesManager } = filesModule;
const { InternalAventusFile } = fileModule;
const { ProjectManager } = projectModule;
const { pathToUri } = toolsModule;

test('response commands resolve cancellation once and ignore late responses', async () => {
    const previous = GenericServer.instance;
    const sent = [];
    GenericServer.instance = { connection: { sendNotification: (...args) => sent.push(args) } };
    try {
        const requests = [
            [AskInput.send({ title: 'Name' }), 'aventus.receiveinput', AskInput],
            [AskSelect.send([{ label: 'One' }]), 'aventus.receiveselect', AskSelect],
            [AskSelectMultiple.send([{ label: 'One' }]), 'aventus.receiveselectmultiple', AskSelectMultiple],
            [Popup.send('Continue?', 'Yes'), 'aventus.popupresponse', Popup],
        ];
        for (let i = requests.length - 1; i >= 0; i--) {
            const [promise, command, notification] = requests[i];
            const id = sent[i][1][0];
            commands[command].run(id, null);
            assert.equal(await promise, null);
            commands[command].run(id, 'late');
            assert.equal(notification.waitingResponse[id], undefined);
        }
        assert.equal(AskSelect.waitingOptions[sent[1][1][0]], undefined);
    } finally {
        GenericServer.instance = previous;
    }
});

test('selection response with a duplicate label resolves to the last matching option', async () => {
    const previous = GenericServer.instance;
    const sent = [];
    GenericServer.instance = { connection: { sendNotification: (...args) => sent.push(args) } };
    try {
        const first = { label: 'Same', detail: 'first' };
        const second = { label: 'Same', detail: 'second' };
        const request = AskSelect.send([first, second]);
        const id = sent[0][1][0];
        commands['aventus.receiveselect'].run(id, { label: 'Same', detail: 'first' });
        assert.equal(await request, second);
        assert.equal(AskSelect.waitingResponse[id], undefined);
        assert.equal(AskSelect.waitingOptions[id], undefined);
    } finally {
        GenericServer.instance = previous;
    }
});

test('formatting continues after a file fails and writes the other formatted file', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-format-batch-'));
    const firstPath = join(root, 'first.wcl.avt');
    const secondPath = join(root, 'second.wcl.avt');
    writeFileSync(firstPath, 'bad');
    writeFileSync(secondPath, 'old');
    const firstUri = pathToUri(firstPath);
    const secondUri = pathToUri(secondPath);
    const first = new InternalAventusFile(TextDocument.create(firstUri, 'typescript', 1, 'bad'));
    const second = new InternalAventusFile(TextDocument.create(secondUri, 'typescript', 1, 'old'));
    first.onFormatting(async () => { throw new Error('format failure'); });
    second.onFormatting(async () => [{
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } },
        newText: 'new',
    }]);
    const previousFiles = FilesManager.instance;
    const previousServer = GenericServer.instance;
    const previousError = console.error;
    const errors = [];
    let formatting;
    FilesManager.instance = {
        getUris: () => [firstUri, secondUri],
        getByUri: uri => ({ [firstUri]: first, [secondUri]: second })[uri],
    };
    GenericServer.instance = { connection: { showLoadingMessage: (_message, action) => { formatting = action(); return formatting; } } };
    console.error = error => errors.push(error);
    try {
        await commands['aventus.format'].run();
        await formatting;
        assert.equal(readFileSync(firstPath, 'utf8'), 'bad');
        assert.equal(readFileSync(secondPath, 'utf8'), 'new');
        assert.equal(errors.length, 1);
        assert.match(errors[0].message, /format failure/);
    } finally {
        clearTimeout(first.delayValidate);
        clearTimeout(second.delayValidate);
        FilesManager.instance = previousFiles;
        GenericServer.instance = previousServer;
        console.error = previousError;
        rmSync(root, { recursive: true, force: true });
    }
});

test('create treats a sibling path as outside and a child path as inside the project', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-create-boundary-'));
    const projectPath = join(root, 'app');
    const siblingPath = join(root, 'app-extra');
    const childPath = join(projectPath, 'src');
    const previousProject = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    const calls = [];
    ProjectManager.getInstance = () => ({ getAllConfigFiles: () => [pathToUri(join(projectPath, 'aventus.conf.avt'))] });
    GenericServer.instance = {
        isIDE: true,
        _localTemplate: { createTemplate: async path => calls.push(['template', path]) },
        _localProject: { createGlobal: async path => calls.push(['project', path]) },
    };
    try {
        await commands['aventus.create'].run(pathToUri(siblingPath));
        await commands['aventus.create'].run(pathToUri(childPath));
        assert.equal(calls.length, 2);
        assert.equal(calls[0][0], 'project');
        assert.equal(calls[0][1].toLowerCase(), siblingPath.toLowerCase());
        assert.equal(calls[1][0], 'template');
        assert.equal(calls[1][1].toLowerCase(), childPath.toLowerCase());
    } finally {
        ProjectManager.getInstance = previousProject;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    }
});
