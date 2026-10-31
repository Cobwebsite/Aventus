import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { Build }, { AventusTsLanguageService },
    { FilesManager }, { GenericServer }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'project/Build.ts',
    'language-services/ts/LanguageService.ts', 'files/FilesManager.ts', 'GenericServer.ts',
]);

function file(uri, content) {
    const document = TextDocument.create(uri, 'typescript', 1, content);
    return { uri, folderUri: uri.slice(0, uri.lastIndexOf('/')), contentUser: content,
        documentInternal: document, documentUser: document };
}

function serviceFor(files) {
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

function applyEdit(file, edit) {
    const start = file.documentInternal.offsetAt(edit.range.start);
    const end = file.documentInternal.offsetAt(edit.range.end);
    return file.contentUser.slice(0, start) + edit.newText + file.contentUser.slice(end);
}

test('a real two-project folder rename resolves both TypeScript imports', async t => {
    const root = pathToFileURL(join(process.cwd(), 'round206-real-rename-batch') + '/').href;
    const uri = name => new URL(name, root).href;
    const oldAlpha = uri('old/alpha.lib.avt');
    const oldBeta = uri('old/beta.lib.avt');
    const newAlpha = uri('new/alpha.lib.avt');
    const newBeta = uri('new/beta.lib.avt');
    const sourceAlpha = file(oldAlpha, 'export class Alpha {}');
    const sourceBeta = file(oldBeta, 'export class Beta {}');
    const consumerA = file(uri('a/consumer.lib.avt'),
        'import { Alpha } from "../old/alpha.lib.avt";\nexport class ConsumerA extends Alpha {}');
    const consumerB = file(uri('b/consumer.lib.avt'),
        'import { Beta } from "../old/beta.lib.avt";\nexport class ConsumerB extends Beta {}');
    const all = Object.fromEntries([sourceAlpha, sourceBeta, consumerA, consumerB].map(item => [item.uri, item]));
    const previousFiles = FilesManager.getInstance;
    const previousServer = GenericServer.instance;
    FilesManager.getInstance = () => ({ getByUri: key => all[key] });
    GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };
    t.after(() => { FilesManager.getInstance = previousFiles; GenericServer.instance = previousServer; });

    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};
    for (const [name, consumer] of [['first', consumerA], ['second', consumerB]]) {
        const build = Object.create(Build.prototype);
        build.tsLanguageService = serviceFor([sourceAlpha, sourceBeta, consumer]);
        const project = Object.create(Project.prototype);
        project.builds = [build];
        manager.projects[name] = project;
    }

    const edits = await manager.onRename([
        { oldUri: oldAlpha, newUri: newAlpha },
        { oldUri: oldBeta, newUri: newBeta },
    ]);
    assert.deepEqual(Object.keys(edits), [consumerA.uri, consumerB.uri]);
    assert.equal(edits[consumerA.uri].length, 1);
    assert.equal(applyEdit(consumerA, edits[consumerA.uri][0]),
        'import { Alpha } from "../new/alpha.lib.avt";\nexport class ConsumerA extends Alpha {}');
    assert.equal(edits[consumerB.uri].length, 1);
    assert.equal(applyEdit(consumerB, edits[consumerB.uri][0]),
        'import { Beta } from "../new/beta.lib.avt";\nexport class ConsumerB extends Beta {}');
});
