import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { Build }, { AventusTsLanguageService }, { FilesManager }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'project/Build.ts',
    'language-services/ts/LanguageService.ts', 'files/FilesManager.ts',
]);

test('a folder rename with two TypeScript files reaches the project as one batch but only the first file supplies edits', async () => {
    const oldRoot = 'file:///project/old';
    const newRoot = 'file:///project/new';
    const changes = ['alpha.lib.avt', 'beta.lib.avt'].map(name => ({
        oldUri: `${oldRoot}/${name}`, newUri: `${newRoot}/${name}`,
    }));
    const calls = [];
    const build = Object.create(Build.prototype);
    build.tsLanguageService = {
        onRenameFile: async (oldUri, newUri) => {
            calls.push([oldUri, newUri]);
            const consumer = oldUri.endsWith('alpha.lib.avt') ? 'alpha-user.lib.avt' : 'beta-user.lib.avt';
            return { [`file:///project/${consumer}`]: [{
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
                newText: newUri,
            }] };
        },
    };
    const project = Object.create(Project.prototype);
    project.builds = [build];
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = { first: project };

    const edits = await manager.onRename(changes);
    assert.deepEqual(calls, [[changes[0].oldUri, changes[0].newUri]]);
    assert.deepEqual(Object.keys(edits), ['file:///project/alpha-user.lib.avt']);
    assert.equal(edits['file:///project/alpha-user.lib.avt'][0].newText, changes[0].newUri);
});

test('multiple imports of one moved file in the same consumer produce only one edit', async t => {
    const oldUri = 'file:///project/old.lib.avt';
    const newUri = 'file:///project/new.lib.avt';
    const consumerUri = 'file:///project/consumer.lib.avt';
    const content = 'import { Alpha } from "./old.lib.avt";\nexport { Alpha } from "./old.lib.avt";';
    const document = TextDocument.create(consumerUri, 'typescript', 1, content);
    const file = { uri: consumerUri, folderUri: 'file:///project', documentInternal: document };
    const prior = FilesManager.getInstance;
    FilesManager.getInstance = () => ({ getByUri: uri => uri === consumerUri ? file : undefined });
    t.after(() => { FilesManager.getInstance = prior; });
    const languageService = Object.create(AventusTsLanguageService.prototype);
    languageService.languageService = { getFileReferences: uri => {
        assert.equal(uri, oldUri);
        return [
            { fileName: consumerUri, textSpan: { start: content.indexOf('./old.lib.avt'), length: './old.lib.avt'.length } },
            { fileName: consumerUri, textSpan: { start: content.lastIndexOf('./old.lib.avt'), length: './old.lib.avt'.length } },
        ];
    } };

    const edits = await languageService.onRenameFile(oldUri, newUri);
    assert.deepEqual(Object.keys(edits), [consumerUri]);
    assert.equal(edits[consumerUri].length, 1);
    assert.deepEqual(edits[consumerUri][0].range.start, document.positionAt(content.lastIndexOf('./old.lib.avt')));
    assert.equal(edits[consumerUri][0].newText, './new.lib.avt');
});
