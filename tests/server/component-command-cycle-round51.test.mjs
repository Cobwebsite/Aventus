import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [commandsModule, filesModule, projectsModule, settingsModule, serverModule, toolsModule] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'project/ProjectManager.ts',
    'settings/Settings.ts', 'GenericServer.ts', 'tools.ts',
]);
const { Commands } = commandsModule;
const { FilesManager } = filesModule;
const { ProjectManager } = projectsModule;
const { SettingsManager } = settingsModule;
const { GenericServer } = serverModule;
const { pathToUri, uriToPath } = toolsModule;

test('split, folder rename and merge update the consumer import', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-component-cycle-'));
    const original = {
        files: FilesManager.getInstance,
        project: ProjectManager.getInstance,
        settings: SettingsManager.getInstance,
        notification: GenericServer.sendNotification,
    };
    const files = new Map();
    const changesSeen = [];
    const makeFile = (uri, content, version = 1) => ({
        uri, path: uriToPath(uri), documentUser: TextDocument.create(uri, 'text', version, content),
        contentUser: content, contentInternal: content, versionUser: version,
        async applyTextEdits(edits) { this.contentUser = edits[0].newText; },
    });
    FilesManager.getInstance = () => ({
        getByUri: uri => files.get(uri),
        onClose: async doc => { files.delete(doc.uri); },
        registerFile: async doc => { files.set(doc.uri, makeFile(doc.uri, doc.getText(), doc.version)); },
    });
    SettingsManager.getInstance = () => ({ settings: { updateImportOnRename: true } });
    GenericServer.sendNotification = () => {};
    try {
        const alphaPath = join(root, 'Alpha.wc.avt');
        const betaPath = join(root, 'Beta.wc.avt');
        const alphaSource = '<script>export class Alpha {}</script><template><p>Alpha</p></template><style>p { color: red; }</style>';
        const betaSource = '<script>import { Alpha } from "./Alpha/Alpha.wcl.avt"; export class Beta extends Alpha {}</script><template><p>Beta</p></template><style>p { color: blue; }</style>';
        for (const [path, source] of [[alphaPath, alphaSource], [betaPath, betaSource]]) {
            writeFileSync(path, source);
            files.set(pathToUri(path), makeFile(pathToUri(path), source));
        }

        await Commands.allCommandes['aventus.component.split'].run(pathToUri(alphaPath));
        const oldFolder = join(root, 'Alpha');
        const newFolder = join(root, 'Renamed');
        renameSync(oldFolder, newFolder);
        for (const extension of ['wcl', 'wcv', 'wcs']) {
            const oldUri = pathToUri(join(oldFolder, `Alpha.${extension}.avt`));
            const newUri = pathToUri(join(newFolder, `Alpha.${extension}.avt`));
            const old = files.get(oldUri);
            files.delete(oldUri);
            files.set(newUri, makeFile(newUri, old.contentUser, old.versionUser));
        }
        ProjectManager.getInstance = () => ({ onRename: async changes => {
            changesSeen.push(...changes);
            const importPath = changes[0].newUri.endsWith('.wc.avt')
                ? './Alpha.wc.avt' : './Renamed/Alpha.wcl.avt';
            return { [pathToUri(betaPath)]: [{ newText: betaSource.replace('./Alpha/Alpha.wcl.avt', importPath) }] };
        } });
        await Commands.allCommandes['aventus.rename'].run([{ oldUri: pathToUri(oldFolder), newUri: pathToUri(newFolder) }]);
        await new Promise(resolve => setTimeout(resolve, 600));
        assert.deepEqual(changesSeen.map(change => [change.oldUri, change.newUri]).sort(),
            ['wcl', 'wcv', 'wcs'].map(extension => [
                pathToUri(join(oldFolder, `Alpha.${extension}.avt`)),
                pathToUri(join(newFolder, `Alpha.${extension}.avt`)),
            ]).sort());
        assert.match(readFileSync(betaPath, 'utf8'), /\.\/Renamed\/Alpha\.wcl\.avt/);

        await Commands.allCommandes['aventus.component.merge'].run(pathToUri(join(newFolder, 'Alpha.wcl.avt')));
        const mergedPath = join(root, 'Alpha.wc.avt');
        assert.equal(existsSync(newFolder), false);
        assert.match(readFileSync(mergedPath, 'utf8'), /export class Alpha/);
        assert.match(readFileSync(mergedPath, 'utf8'), /<p>Alpha<\/p>/);
        assert.match(readFileSync(mergedPath, 'utf8'), /color: red/);
        assert.equal(readFileSync(betaPath, 'utf8').includes('export class Beta extends Alpha'), true);
        assert.match(readFileSync(betaPath, 'utf8'), /\.\/Alpha\.wc\.avt/);
        assert.doesNotMatch(readFileSync(betaPath, 'utf8'), /\.\/Renamed\/Alpha\.wcl\.avt/);
        assert.deepEqual(changesSeen.at(-1), {
            oldUri: pathToUri(join(newFolder, 'Alpha.wcl.avt')),
            newUri: pathToUri(mergedPath),
        });
    } finally {
        FilesManager.getInstance = original.files;
        ProjectManager.getInstance = original.project;
        SettingsManager.getInstance = original.settings;
        GenericServer.sendNotification = original.notification;
        rmSync(root, { recursive: true, force: true });
    }
});
