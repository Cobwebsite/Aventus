import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { ProjectManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'project/ProjectManager.ts', 'GenericServer.ts', 'tools.ts',
]);

for (const collision of ['disk', 'registered document']) {
    test(`merge preserves a split component when its destination already exists on ${collision}`, async t => {
        const root = mkdtempSync(join(tmpdir(), 'aventus-merge-destination-'));
        t.after(() => rmSync(root, { recursive: true, force: true }));
        const folder = join(root, 'Card');
        mkdirSync(folder);
        const sourcePath = join(folder, 'Card.wcl.avt');
        const sourceUri = pathToUri(sourcePath);
        const destinationPath = join(root, 'Card.wc.avt');
        const destinationUri = pathToUri(destinationPath);
        const content = 'export class Card {}';
        writeFileSync(sourcePath, content);
        if (collision === 'disk') writeFileSync(destinationPath, 'existing destination');
        const documentUser = TextDocument.create(sourceUri, 'typescript', 4, content);
        const source = { uri: sourceUri, path: sourcePath, documentUser, contentUser: content, versionUser: 4 };
        const previousFiles = FilesManager.getInstance;
        const previousProjects = ProjectManager.getInstance;
        const previousNotification = GenericServer.sendNotification;
        const previousError = GenericServer.showErrorMessage;
        t.after(() => {
            FilesManager.getInstance = previousFiles;
            ProjectManager.getInstance = previousProjects;
            GenericServer.sendNotification = previousNotification;
            GenericServer.showErrorMessage = previousError;
        });
        const errors = [];
        FilesManager.getInstance = () => ({
            getByUri: uri => uri === sourceUri ? source : uri === destinationUri && collision === 'registered document' ? { uri } : undefined,
            onClose: () => assert.fail('collision must keep source registered'),
            registerFile: () => assert.fail('collision must not register a replacement'),
        });
        ProjectManager.getInstance = () => ({ onRename: () => assert.fail('collision must not rename references') });
        GenericServer.sendNotification = () => assert.fail('collision must not notify the client');
        GenericServer.showErrorMessage = message => errors.push(message);

        await Commands.allCommandes['aventus.component.merge'].run(sourceUri);

        assert.equal(readFileSync(sourcePath, 'utf8'), content);
        if (collision === 'disk') assert.equal(readFileSync(destinationPath, 'utf8'), 'existing destination');
        else assert.equal(existsSync(destinationPath), false);
        assert.deepEqual(errors, [`Cannot merge component because the destination already exists: ${destinationUri}`]);
    });
}
