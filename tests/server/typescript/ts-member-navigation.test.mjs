import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

function fixture(name, ownerSource, userSource) {
    const ownerUri = `file:///D:/round163/${name}-owner.lib.avt`;
    const userUri = `file:///D:/round163/${name}-user.lib.avt`;
    const sources = { [ownerUri]: ownerSource, [userUri]: userSource };
    const versions = { [ownerUri]: 0, [userUri]: 0 };
    const files = {};
    function refresh(uri, text) {
        sources[uri] = text;
        versions[uri]++;
        const document = TextDocument.create(uri, 'typescript', versions[uri], text);
        const file = { uri, documentInternal: document, documentUser: document, contentInternal: text, versionInternal: versions[uri] };
        files[uri] = { file, versionInternal: versions[uri], contentForLanguageService: text };
    }
    for (const [uri, text] of Object.entries(sources)) refresh(uri, text);
    const host = {
        getCompilationSettings: () => ({ noLib: true, target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true }),
        getScriptFileNames: () => Object.keys(sources), getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: uri => String(versions[uri] ?? 0),
        getScriptSnapshot: uri => sources[uri] === undefined ? undefined : ts.ScriptSnapshot.fromString(sources[uri]),
        getCurrentDirectory: () => '/', getDefaultLibFileName: () => '',
        fileExists: uri => uri in sources, readFile: uri => sources[uri], readDirectory: () => [],
    };
    const languageService = ts.createLanguageService(host);
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageService = languageService;
    service.languageServiceNamespace = languageService;
    service.filesLoaded = files;
    service.filesNeeded = Object.keys(files);
    service.i18nFiles = {};
    service.build = { tsFiles: files };
    const position = name => files[userUri].file.documentInternal.positionAt(sources[userUri].lastIndexOf(name) + 1);
    return { ownerUri, userUri, files, service, refresh, position, dispose: () => languageService.dispose() };
}

test('un appel de méthode héritée suit la déclaration déplacée puis renommée dans le parent', async () => {
    const f = fixture('inherited', 'class Base { public send(): void {} }', 'class Child extends Base {}\nnew Child().send();');
    try {
        const before = await f.service.findDefinition(f.files[f.userUri].file, f.position('send'));
        assert.equal(before?.[0]?.uri, f.ownerUri);
        assert.equal(f.files[f.ownerUri].file.documentInternal.getText(before[0].range), 'send');

        f.refresh(f.ownerUri, '\nclass Base { public dispatch(): void {} }');
        f.refresh(f.userUri, 'class Child extends Base {}\nnew Child().dispatch();');
        const after = await f.service.findDefinition(f.files[f.userUri].file, f.position('dispatch'));
        assert.equal(after?.[0]?.uri, f.ownerUri);
        assert.equal(after[0].range.start.line, 1);
        assert.equal(f.files[f.ownerUri].file.documentInternal.getText(after[0].range), 'dispatch');
        const edits = await f.service.onRename(f.files[f.userUri].file, f.position('dispatch'), 'deliver');
        assert.deepEqual(new Set(Object.keys(edits?.changes ?? {})), new Set([f.ownerUri, f.userUri]));
    } finally { f.dispose(); }
});

test('la navigation vers une méthode statique change de propriétaire après remplacement du récepteur', async () => {
    const f = fixture('static', 'class First { public static open(): void {} }\nclass Second { public static open(): void {} }', 'First.open();');
    try {
        const before = await f.service.findDefinition(f.files[f.userUri].file, f.position('open'));
        assert.equal(before?.[0]?.uri, f.ownerUri);
        const owner = f.files[f.ownerUri].file.documentInternal;
        assert.equal(owner.getText(before[0].range), 'open');
        assert.equal(before[0].range.start.line, 0);

        f.refresh(f.userUri, 'Second.open();');
        const after = await f.service.findDefinition(f.files[f.userUri].file, f.position('open'));
        assert.equal(after?.[0]?.uri, f.ownerUri);
        assert.equal(after[0].range.start.line, 1);
        const edits = await f.service.onRename(f.files[f.userUri].file, f.position('open'), 'show');
        assert.deepEqual(new Set(Object.keys(edits?.changes ?? {})), new Set([f.ownerUri, f.userUri]));
        assert.equal(edits.changes[f.ownerUri].length, 1);
        assert.equal(owner.getText(edits.changes[f.ownerUri][0].range), 'open');
    } finally { f.dispose(); }
});
