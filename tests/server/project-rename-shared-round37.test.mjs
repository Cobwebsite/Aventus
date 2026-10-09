import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { mkdtempSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { Build }, { AventusTsLanguageService }, { FilesManager }, { GenericServer }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'project/Build.ts',
    'language-services/ts/LanguageService.ts', 'files/FilesManager.ts', 'GenericServer.ts',
]);

function sourceFile(uri, content) {
    const document = TextDocument.create(uri, 'typescript', 1, content);
    return { uri, folderUri: uri.slice(0, uri.lastIndexOf('/')), contentUser: content,
        documentInternal: document, documentUser: document };
}

function serviceFor(files) {
    const sources = Object.fromEntries(Object.values(files).map(file => [file.uri, file.contentUser]));
    const host = {
        getCompilationSettings: () => ({ noLib: true, target: ts.ScriptTarget.ES2022, moduleResolution: ts.ModuleResolutionKind.Node10,
            allowNonTsExtensions: true, allowImportingTsExtensions: true }),
        getScriptFileNames: () => Object.keys(sources),
        getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: () => '1',
        getScriptSnapshot: name => sources[name] === undefined ? undefined : ts.ScriptSnapshot.fromString(sources[name]),
        getCurrentDirectory: () => '/', getDefaultLibFileName: () => '',
        fileExists: name => sources[name] !== undefined,
        readFile: name => sources[name], readDirectory: () => [],
        resolveModuleNames: (names, containingFile) => names.map(name => {
            const resolvedFileName = new URL(name, containingFile).href;
            return sources[resolvedFileName] === undefined ? undefined :
                { resolvedFileName, extension: ts.Extension.Ts, isExternalLibraryImport: false };
        }),
    };
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageService = ts.createLanguageService(host);
    service.filesLoaded = Object.fromEntries(Object.values(files).map(file => [file.uri, { file }]));
    return service;
}

function applyEdits(content, document, edits) {
    const spans = edits.map(edit => ({ start: document.offsetAt(edit.range.start),
        end: document.offsetAt(edit.range.end), replacement: edit.newText }));
    // Two builds containing the same source return the same edit twice.
    const unique = [...new Map(spans.map(span => [`${span.start}:${span.end}:${span.replacement}`, span])).values()];
    for (const edit of unique.sort((a, b) => b.start - a.start)) {
        content = content.slice(0, edit.start) + edit.replacement + content.slice(edit.end);
    }
    return content;
}

for (const kind of ['file', 'folder']) test(`two projects with shared TS sources update imports after a real ${kind} rename`, async t => {
    const root = mkdtempSync(join(process.cwd(), 'aventus-project-rename-round37-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const oldFolder = join(root, 'src', 'legacy');
    const newFolder = join(root, 'src', 'modern');
    const oldPath = kind === 'file' ? join(root, 'src', 'base.lib.avt') : join(oldFolder, 'base.lib.avt');
    const newPath = kind === 'file' ? join(root, 'src', 'moved.lib.avt') : join(newFolder, 'base.lib.avt');
    const consumerPath = join(root, 'src', 'consumer.lib.avt');
    mkdirSync(dirname(oldPath), { recursive: true });
    writeFileSync(oldPath, 'export class Base {}');
    writeFileSync(consumerPath, `import { Base } from "${kind === 'file' ? './base.lib.avt' : './legacy/base.lib.avt'}";\nexport class Consumer extends Base {}`);
    const oldUri = pathToFileURL(oldPath).href;
    const newUri = pathToFileURL(newPath).href;
    const consumerUri = pathToFileURL(consumerPath).href;
    const files = { [oldUri]: sourceFile(oldUri, readFileSync(oldPath, 'utf8')),
        [consumerUri]: sourceFile(consumerUri, readFileSync(consumerPath, 'utf8')) };
    const previousFiles = FilesManager.getInstance;
    const previousServer = GenericServer.instance;
    FilesManager.getInstance = () => ({ getByUri: uri => files[uri] });
    GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };
    t.after(() => { FilesManager.getInstance = previousFiles; GenericServer.instance = previousServer; });
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};
    for (const name of ['first', 'second']) {
        const build = Object.create(Build.prototype);
        build.tsLanguageService = serviceFor(files);
        const project = Object.create(Project.prototype);
        project.builds = [build];
        manager.projects[name] = project;
    }
    const edits = await manager.onRename([{ oldUri, newUri }]);
    assert.deepEqual(Object.keys(edits), [consumerUri]);
    assert.equal(edits[consumerUri].length, 2);
    assert.equal(new Set(edits[consumerUri].map(edit => JSON.stringify(edit))).size, 1);
    const revised = applyEdits(files[consumerUri].contentUser, files[consumerUri].documentInternal, edits[consumerUri]);
    writeFileSync(consumerPath, revised);
    renameSync(kind === 'file' ? oldPath : oldFolder, kind === 'file' ? newPath : newFolder);
    assert.match(readFileSync(consumerPath, 'utf8'), kind === 'file' ?
        /from "\.\/moved\.lib\.avt"/ : /from "\.\/modern\/base\.lib\.avt"/);
    assert.equal(readFileSync(newPath, 'utf8'), 'export class Base {}');
});
