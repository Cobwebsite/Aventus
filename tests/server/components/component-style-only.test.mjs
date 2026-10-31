import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { GenericServer }, { pathToUri, uriToPath }, { ProjectManager }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts', 'project/ProjectManager.ts',
]);

async function withComponent(run) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-component-style-only-'));
    const oldFiles = FilesManager.getInstance;
    const oldProjects = ProjectManager.getInstance;
    const oldNotification = GenericServer.sendNotification;
    const files = new Map();
    const events = [];
    const renames = [];
    const stored = document => ({
        uri: document.uri, path: uriToPath(document.uri), documentUser: document,
        contentUser: document.getText(), contentInternal: document.getText(), versionUser: document.version,
    });
    FilesManager.getInstance = () => ({
        getByUri: uri => files.get(uri),
        onClose: document => { files.delete(document.uri); },
        registerFile: document => { files.set(document.uri, stored(document)); },
    });
    ProjectManager.getInstance = () => ({ onRename: async changes => { renames.push(...changes); return {}; } });
    GenericServer.sendNotification = (...event) => events.push(event);
    try { await run({ root, files, events, renames, stored }); }
    finally {
        FilesManager.getInstance = oldFiles;
        ProjectManager.getInstance = oldProjects;
        GenericServer.sendNotification = oldNotification;
        rmSync(root, { recursive: true, force: true });
    }
}

test('split of style-only single-file component creates empty logic and view siblings', async () => {
    await withComponent(async ({ root, files, events, stored }) => {
        const source = join(root, 'StyleOnly.wc.avt');
        const uri = pathToUri(source);
        const content = '<style>.card { color: red; }</style>';
        writeFileSync(source, content);
        files.set(uri, stored(TextDocument.create(uri, 'Aventus WebComponent', 4, content)));

        await Commands.allCommandes['aventus.component.split'].run(uri);

        const folder = join(root, 'StyleOnly');
        assert.equal(existsSync(source), false);
        assert.equal(readFileSync(join(folder, 'StyleOnly.wcl.avt'), 'utf8'), '');
        assert.equal(readFileSync(join(folder, 'StyleOnly.wcv.avt'), 'utf8'), '');
        assert.equal(readFileSync(join(folder, 'StyleOnly.wcs.avt'), 'utf8'), '.card { color: red; }');
        for (const extension of ['wcl', 'wcv', 'wcs']) {
            assert.equal(files.get(pathToUri(join(folder, `StyleOnly.${extension}.avt`))).versionUser, 5);
        }
        assert.deepEqual(events.map(([channel]) => channel), ['aventus/closefile', 'aventus/openfile']);
    });
});

test('merge of style-only split component preserves CSS and produces empty script and template', async () => {
    await withComponent(async ({ root, files, events, renames, stored }) => {
        const folder = join(root, 'StyleOnly');
        mkdirSync(folder);
        const stylePath = join(folder, 'StyleOnly.wcs.avt');
        const styleUri = pathToUri(stylePath);
        const content = '.card { color: blue; }';
        writeFileSync(stylePath, content);
        files.set(styleUri, stored(TextDocument.create(styleUri, 'scss', 6, content)));

        await Commands.allCommandes['aventus.component.merge'].run(styleUri);

        const merged = join(root, 'StyleOnly.wc.avt');
        const result = readFileSync(merged, 'utf8');
        assert.equal(existsSync(folder), false);
        assert.match(result, /<style>\s*\.card \{ color: blue; \}\s*<\/style>/);
        assert.match(result, /<script>\s*<\/script>/);
        assert.match(result, /<template>\s*<\/template>/);
        assert.equal(files.get(pathToUri(merged)).versionUser, 7);
        assert.deepEqual(renames, [{
            oldUri: pathToUri(join(folder, 'StyleOnly.wcl.avt')),
            newUri: pathToUri(merged),
        }]);
        assert.deepEqual(events.map(([channel]) => channel), ['aventus/closefile', 'aventus/openfile']);
    });
});
