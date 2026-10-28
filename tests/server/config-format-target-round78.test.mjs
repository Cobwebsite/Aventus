import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [commands, projectModule, filesModule, fileModule, serverModule] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'files/FilesManager.ts',
    'files/AventusFile.ts', 'GenericServer.ts',
]);
const AddConfigSection = commands.Commands.allCommandes['aventus.addConfigSection'];
const Format = commands.Commands.allCommandes['aventus.format'];
const { ProjectManager } = projectModule;
const { FilesManager } = filesModule;
const { InternalAventusFile } = fileModule;
const { GenericServer } = serverModule;

test('add config section formats only the selected configuration and sends its URI', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-section-target-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const selectedPath = join(root, 'selected.conf.avt');
    const otherPath = join(root, 'other.conf.avt');
    const selectedUri = pathToFileURL(selectedPath).href;
    const otherUri = pathToFileURL(otherPath).href;
    const original = '{"module":"Demo","build":[],"static":[],"custom":{"keep":true}}';
    writeFileSync(selectedPath, original);
    writeFileSync(otherPath, original);
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    const notifications = [];
    ProjectManager.getInstance = () => ({ getAllConfigFiles: () => [selectedUri, otherUri] });
    GenericServer.instance = { logLevel: 4, connection: {
        Select: async (_items, options) => options.title === 'Section type'
            ? { label: 'Build' } : { label: selectedUri },
        Input: async () => 'Main App',
        sendNotification: (...args) => notifications.push(args),
    } };
    try {
        await AddConfigSection.run();
        const expected = JSON.parse(original);
        expected.build.push({ name: 'Main_App', src: [], compile: [{ output: './dist/Main-App.js' }] });
        assert.equal(readFileSync(selectedPath, 'utf8'), JSON.stringify(expected, null, 4));
        assert.equal(readFileSync(otherPath, 'utf8'), original);
        assert.deepEqual(notifications, [['aventus/openfile', [selectedUri]]]);
    } finally {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    }
});

test('add config section cancels at project or name prompt without writing', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-section-cancel-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const configPath = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(configPath).href;
    const original = '{"build":[],"static":[]}';
    writeFileSync(configPath, original);
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    const notifications = [];
    ProjectManager.getInstance = () => ({ getAllConfigFiles: () => [uri, uri + '?second'] });
    let selectProject = true;
    GenericServer.instance = { logLevel: 4, connection: {
        Select: async (_items, options) => options.title === 'Select a project to add section'
            ? (selectProject ? null : { label: uri }) : { label: 'Static' },
        Input: async () => null,
        sendNotification: (...args) => notifications.push(args),
    } };
    try {
        await AddConfigSection.run();
        selectProject = false;
        await AddConfigSection.run();
        assert.equal(readFileSync(configPath, 'utf8'), original);
        assert.deepEqual(notifications, []);
    } finally {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    }
});

test('add config section with no discovered configuration warns the client', async () => {
    const previousManager = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    const warnings = [];
    const prompts = [];
    ProjectManager.getInstance = () => ({ getAllConfigFiles: () => [] });
    GenericServer.instance = { logLevel: 4, connection: {
        Select: async (...args) => prompts.push(args),
        showWarningMessage: message => warnings.push(message),
    } };
    try {
        await AddConfigSection.run();
        assert.deepEqual(warnings, ['No Aventus configuration was found.']);
        assert.deepEqual(prompts, []);
    } finally {
        ProjectManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
    }
});

test('format command with a URI formats that file alone, including when other files are unavailable', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-format-target-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const selectedPath = join(root, 'selected.wcl.avt');
    const otherPath = join(root, 'other.wcl.avt');
    writeFileSync(selectedPath, 'old');
    writeFileSync(otherPath, 'other');
    const selectedUri = pathToFileURL(selectedPath).href;
    const otherUri = pathToFileURL(otherPath).href;
    const selected = new InternalAventusFile(TextDocument.create(selectedUri, 'typescript', 1, 'old'));
    selected.onFormatting(async () => [{
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } },
        newText: 'new',
    }]);
    const previousFiles = FilesManager.instance;
    const previousServer = GenericServer.instance;
    const accessed = [];
    FilesManager.instance = {
        getUris: () => { throw new Error('untargeted enumeration'); },
        getByUri: uri => { accessed.push(uri); return uri === selectedUri ? selected : undefined; },
    };
    GenericServer.instance = { logLevel: 4, connection: {
        showLoadingMessage: async (_message, action) => action(),
    } };
    try {
        await Format.run(selectedUri);
        await Format.run(otherUri);
        assert.deepEqual(accessed, [selectedUri, otherUri]);
        assert.equal(readFileSync(selectedPath, 'utf8'), 'new');
        assert.equal(readFileSync(otherPath, 'utf8'), 'other');
    } finally {
        clearTimeout(selected.delayValidate);
        FilesManager.instance = previousFiles;
        GenericServer.instance = previousServer;
    }
});
