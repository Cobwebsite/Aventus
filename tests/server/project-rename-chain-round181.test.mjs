import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { Build }, { AventusTsLanguageService },
    { FilesManager }, { GenericServer }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'project/Build.ts',
    'language-services/ts/LanguageService.ts', 'files/FilesManager.ts', 'GenericServer.ts',
]);

function file(uri, content, version) {
    const document = TextDocument.create(uri, 'typescript', version, content);
    return { uri, folderUri: uri.slice(0, uri.lastIndexOf('/')), contentUser: content,
        documentInternal: document, documentUser: document };
}

function languageService(files) {
    const sources = Object.fromEntries(files.map(item => [item.uri, item.contentUser]));
    const host = {
        getCompilationSettings: () => ({ noLib: true, target: ts.ScriptTarget.ES2022,
            moduleResolution: ts.ModuleResolutionKind.Node10, allowNonTsExtensions: true,
            allowImportingTsExtensions: true }),
        getScriptFileNames: () => Object.keys(sources), getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: () => '1',
        getScriptSnapshot: name => sources[name] === undefined ? undefined : ts.ScriptSnapshot.fromString(sources[name]),
        getCurrentDirectory: () => '/', getDefaultLibFileName: () => '',
        fileExists: name => sources[name] !== undefined, readFile: name => sources[name],
        readDirectory: () => [],
        resolveModuleNames: (names, containingFile) => names.map(name => {
            const resolvedFileName = new URL(name, containingFile).href;
            return sources[resolvedFileName] === undefined ? undefined :
                { resolvedFileName, extension: ts.Extension.Ts, isExternalLibraryImport: false };
        }),
    };
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageService = ts.createLanguageService(host);
    service.filesLoaded = Object.fromEntries(files.map(item => [item.uri, { file: item }]));
    return service;
}

function changedText(file, edits) {
    let content = file.contentUser;
    const spans = edits.map(edit => ({ start: file.documentInternal.offsetAt(edit.range.start),
        end: file.documentInternal.offsetAt(edit.range.end), text: edit.newText }));
    for (const edit of spans.sort((a, b) => b.start - a.start)) {
        content = content.slice(0, edit.start) + edit.text + content.slice(edit.end);
    }
    return content;
}

test('two projects keep distinct rename edits over two successive file moves', async t => {
    const root = pathToFileURL(join(process.cwd(), 'round181-rename-chain') + '/').href;
    const target = name => new URL(name, root).href;
    const first = target('first.lib.avt');
    const second = target('second.lib.avt');
    const third = target('third.lib.avt');
    const consumerA = target('a/consumer.lib.avt');
    const consumerB = target('b/consumer.lib.avt');
    const isolated = target('unrelated/consumer.lib.avt');
    const previousFiles = FilesManager.getInstance;
    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };
    t.after(() => { FilesManager.getInstance = previousFiles; GenericServer.instance = previousServer; });

    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};
    for (const [oldUri, newUri, oldName, newName, version] of [
        [first, second, 'first', 'second', 1],
        [second, third, 'second', 'third', 2],
    ]) {
        const targetFile = file(oldUri, 'export class Shared {}', version);
        const a = file(consumerA, `import { Shared } from "../${oldName}.lib.avt";\nexport class A extends Shared {}`, version);
        const b = file(consumerB, `import { Shared } from "../${oldName}.lib.avt";\nexport class B extends Shared {}`, version);
        const other = file(isolated, 'export class Unrelated {}', version);
        const all = { [oldUri]: targetFile, [consumerA]: a, [consumerB]: b, [isolated]: other };
        FilesManager.getInstance = () => ({ getByUri: uri => all[uri] });
        const projectA = Object.create(Project.prototype);
        const projectB = Object.create(Project.prototype);
        const buildA = Object.create(Build.prototype);
        const buildB = Object.create(Build.prototype);
        buildA.tsLanguageService = languageService([targetFile, a, other]);
        buildB.tsLanguageService = languageService([targetFile, b]);
        projectA.builds = [buildA];
        projectB.builds = [buildB];
        manager.projects = { first: projectA, second: projectB };

        const edits = await manager.onRename([{ oldUri, newUri }]);
        assert.deepEqual(Object.keys(edits).sort(), [consumerA, consumerB].sort());
        assert.equal(edits[consumerA].length, 1);
        assert.equal(edits[consumerB].length, 1);
        assert.equal(changedText(a, edits[consumerA]),
            `import { Shared } from "../${newName}.lib.avt";\nexport class A extends Shared {}`);
        assert.equal(changedText(b, edits[consumerB]),
            `import { Shared } from "../${newName}.lib.avt";\nexport class B extends Shared {}`);
        assert.equal(edits[isolated], undefined);
    }
});
