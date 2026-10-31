import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { GenericServer }, { pathToUri, uriToPath }, { ProjectManager }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'tools.ts', 'project/ProjectManager.ts',
]);

test('merge normalizes mixed line endings from live component documents and advances the maximum version', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-merge-line-endings-'));
    const folder = join(root, 'Mixed');
    mkdirSync(folder);
    const originalFiles = FilesManager.getInstance;
    const originalProjects = ProjectManager.getInstance;
    const originalNotification = GenericServer.sendNotification;
    const files = new Map();
    const events = [];
    const renames = [];
    FilesManager.getInstance = () => ({
        getByUri: uri => files.get(uri),
        onClose: document => files.delete(document.uri),
        registerFile: document => files.set(document.uri, {
            uri: document.uri, path: uriToPath(document.uri), documentUser: document,
            contentUser: document.getText(), versionUser: document.version,
        }),
    });
    ProjectManager.getInstance = () => ({ onRename: async changes => { renames.push(...changes); return {}; } });
    GenericServer.sendNotification = (...event) => events.push(event);

    try {
        const sources = [
            ['wcl', 4, 'class Mixed {\r\n    value = 1;\r\n}', 'class Stale {}'],
            ['wcv', 11, '<div>\rLine one\r\nLine two</div>', '<div>stale</div>'],
            ['wcs', 7, '.mixed {\r\n  color: red;\r}', '.stale {}'],
        ];
        for (const [extension, version, liveText, diskText] of sources) {
            const path = join(folder, `Mixed.${extension}.avt`);
            const uri = pathToUri(path);
            writeFileSync(path, diskText);
            const document = TextDocument.create(uri, extension, version, liveText);
            files.set(uri, {
                uri, path, documentUser: document, contentUser: liveText, versionUser: version,
            });
        }

        await Commands.allCommandes['aventus.component.merge'].run(pathToUri(join(folder, 'Mixed.wcv.avt')));

        const destination = join(root, 'Mixed.wc.avt');
        const result = readFileSync(destination, 'utf8');
        assert.equal(result.includes('\r'), false);
        assert.match(result, /class Mixed \{\n\s+value = 1;\n\s+\}/);
        assert.match(result, /<div>\n\s+Line one\n\s+Line two<\/div>/);
        assert.match(result, /\.mixed \{\n\s+color: red;\n\s+\}/);
        assert.doesNotMatch(result, /Stale|stale/);
        assert.equal(files.get(pathToUri(destination)).versionUser, 12);
        assert.deepEqual(renames, [{ oldUri: pathToUri(join(folder, 'Mixed.wcl.avt')), newUri: pathToUri(destination) }]);
        assert.deepEqual(events.map(([channel]) => channel), [
            'aventus/closefile', 'aventus/closefile', 'aventus/closefile', 'aventus/openfile',
        ]);
    } finally {
        FilesManager.getInstance = originalFiles;
        ProjectManager.getInstance = originalProjects;
        GenericServer.sendNotification = originalNotification;
        rmSync(root, { recursive: true, force: true });
    }
});
