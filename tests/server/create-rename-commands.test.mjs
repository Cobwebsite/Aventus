import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [commandsModule, projectsModule, filesModule, settingsModule, serverModule, toolsModule] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'files/FilesManager.ts',
    'settings/Settings.ts', 'GenericServer.ts', 'tools.ts',
]);
const { Commands } = commandsModule;
const { ProjectManager } = projectsModule;
const { FilesManager } = filesModule;
const { SettingsManager } = settingsModule;
const { GenericServer } = serverModule;
const { pathToUri } = toolsModule;

async function withCommands(callback) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-commands-'));
    const original = {
        project: ProjectManager.getInstance, files: FilesManager.getInstance,
        settings: SettingsManager.getInstance, server: GenericServer.instance,
    };
    const calls = [];
    const project = { getAllConfigFiles: () => [], onRename: async changes => { calls.push(changes); return {}; } };
    ProjectManager.getInstance = () => project;
    FilesManager.getInstance = () => ({ getByUri: () => undefined });
    SettingsManager.getInstance = () => ({ settings: { updateImportOnRename: true } });
    GenericServer.instance = { isIDE: true, _localProject: { createGlobal: async path => calls.push(['project', path]) }, _localTemplate: { createTemplate: async path => calls.push(['template', path]) } };
    try {
        await callback({ root, calls, project });
    } finally {
        ProjectManager.getInstance = original.project;
        FilesManager.getInstance = original.files;
        SettingsManager.getInstance = original.settings;
        GenericServer.instance = original.server;
        rmSync(root, { recursive: true, force: true });
    }
}

test('create delegates to project or template manager based on config location', async () => {
    await withCommands(async ({ root, calls, project }) => {
        const outside = pathToUri(root);
        const inside = pathToUri(join(root, 'demo', 'src'));
        project.getAllConfigFiles = () => [pathToUri(join(root, 'demo', 'aventus.conf.avt'))];
        await Commands.allCommandes['aventus.create'].run(outside);
        await Commands.allCommandes['aventus.create'].run(inside);
        assert.deepEqual(calls.map(item => item[0]), ['project', 'template']);
        assert.equal(calls[0][1].toLowerCase(), root.toLowerCase());
        assert.equal(calls[1][1].toLowerCase(), join(root, 'demo', 'src').toLowerCase());
    });
});

test('create in CLI mode uses the selected folder and respects cancellation', async () => {
    await withCommands(async ({ root, calls, project }) => {
        const projectPath = join(root, 'demo');
        const sourceUri = pathToUri(join(projectPath, 'src'));
        const selectedPath = join(projectPath, 'other');
        project.getAllConfigFiles = () => [pathToUri(join(projectPath, 'aventus.conf.avt'))];
        GenericServer.instance.isIDE = false;
        GenericServer.instance.connection = { SelectFolder: async () => pathToUri(selectedPath) };
        await Commands.allCommandes['aventus.create'].run(sourceUri);
        assert.deepEqual(calls.map(item => item[0]), ['template']);
        assert.equal(calls[0][1].replaceAll('\\', '/').toLowerCase(), selectedPath.replaceAll('\\', '/').toLowerCase());
        calls.length = 0;
        GenericServer.instance.connection.SelectFolder = async () => undefined;
        await Commands.allCommandes['aventus.create'].run(sourceUri);
        assert.deepEqual(calls, []);
    });
});

test('rename expands a directory into file changes including nested children', async () => {
    await withCommands(async ({ root, calls }) => {
        const oldPath = join(root, 'old');
        const newPath = join(root, 'new');
        mkdirSync(join(newPath, 'nested'), { recursive: true });
        writeFileSync(join(newPath, 'one.wcl.avt'), 'one');
        writeFileSync(join(newPath, 'nested', 'two.wcv.avt'), 'two');
        await Commands.allCommandes['aventus.rename'].run([{ oldUri: pathToUri(oldPath), newUri: pathToUri(newPath) }]);
        assert.deepEqual(calls[0], [
            { oldUri: pathToUri(join(oldPath, 'nested', 'two.wcv.avt')), newUri: pathToUri(join(newPath, 'nested', 'two.wcv.avt')) },
            { oldUri: pathToUri(join(oldPath, 'one.wcl.avt')), newUri: pathToUri(join(newPath, 'one.wcl.avt')) },
        ]);
    });
});

test('rename applies edits to open files and writes updated content after delay', async () => {
    await withCommands(async ({ root, calls, project }) => {
        const oldPath = join(root, 'old.wcl.avt');
        const newPath = join(root, 'new.wcl.avt');
        const sourcePath = join(root, 'consumer.wcl.avt');
        writeFileSync(newPath, 'class New {}');
        writeFileSync(sourcePath, 'before');
        const sourceUri = pathToUri(sourcePath);
        project.onRename = async changes => {
            calls.push(changes);
            return { [sourceUri]: [{ newText: 'after' }] };
        };
        FilesManager.getInstance = () => ({ getByUri: uri => uri === sourceUri ? {
            uri, contentUser: 'before',
            async applyTextEdits() { this.contentUser = 'after'; },
        } : undefined });
        await Commands.allCommandes['aventus.rename'].run([{ oldUri: pathToUri(oldPath), newUri: pathToUri(newPath) }]);
        assert.deepEqual(calls[0], [{ oldUri: pathToUri(oldPath), newUri: pathToUri(newPath) }]);
        await new Promise(resolve => setTimeout(resolve, 600));
        assert.equal(readFileSync(sourcePath, 'utf8'), 'after');
    });
});
