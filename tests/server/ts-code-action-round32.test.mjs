import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };

test('TypeScript missing interface member action edits its class and clears the diagnostic', async () => {
    const uri = 'file:///D:/test/round32-code-action.lib.avt';
    let source = 'interface Named { name(): string; }\nclass Card implements Named {\n}\n';
    let version = 1;
    const document = () => TextDocument.create(uri, 'typescript', version, source);
    const file = { uri, documentInternal: document(), documentUser: document(), contentInternal: source, versionInternal: version };
    const tsFile = { file, versionInternal: version, contentForLanguageService: source };
    const host = {
        getCompilationSettings: () => ({ noLib: true, target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true }),
        getScriptFileNames: () => [uri],
        getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: () => String(version),
        getScriptSnapshot: name => name === uri ? ts.ScriptSnapshot.fromString(source) : undefined,
        getCurrentDirectory: () => '/', getDefaultLibFileName: () => '',
        fileExists: name => name === uri, readFile: name => name === uri ? source : undefined,
        readDirectory: () => [],
    };
    const languageService = ts.createLanguageService(host);
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageService = languageService;
    service.languageServiceNamespace = languageService;
    service.filesLoaded = { [uri]: tsFile };
    service.filesNeeded = [uri];
    service.i18nFiles = {};
    service.build = {
        tsFiles: { [uri]: tsFile }, npmBuilder: { unregister() {} },
        buildConfig: { stories: false }, hasNpmOutput: false, namespaces: [],
    };

    const before = languageService.getSemanticDiagnostics(uri).find(diagnostic => diagnostic.code === 2420);
    assert.ok(before, 'missing interface method has a TypeScript diagnostic');
    const range = {
        start: file.documentInternal.positionAt(before.start),
        end: file.documentInternal.positionAt(before.start + before.length),
    };
    const actions = await service.doCodeAction(file, range);
    const action = actions.find(item => /implement interface/i.test(item.title));
    assert.ok(action, `missing member action among ${actions.map(item => item.title).join(', ')}`);
    const edits = action.edit.changes[uri];
    assert.ok(edits?.length);
    assert.ok(edits.every(edit => file.documentUser.offsetAt(edit.range.start) >= source.indexOf('class Card')));
    assert.ok(edits.every(edit => file.documentUser.offsetAt(edit.range.end) <= source.lastIndexOf('}')));
    const updated = TextDocument.applyEdits(file.documentUser, edits);
    assert.match(updated, /name\(\): string/);
    assert.match(updated, /class Card implements Named/);

    source = updated;
    version++;
    file.documentInternal = document();
    file.documentUser = file.documentInternal;
    file.contentInternal = source;
    file.versionInternal = version;
    tsFile.versionInternal = version;
    tsFile.contentForLanguageService = source;
    assert.equal(languageService.getSemanticDiagnostics(uri).some(diagnostic => diagnostic.code === 2420), false);
});
