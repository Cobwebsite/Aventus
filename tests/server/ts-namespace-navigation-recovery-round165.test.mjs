import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('une fonction de namespace perd puis retrouve sa définition après édition de sa source', async () => {
    const ownerUri = 'file:///D:/round165/namespace-owner.lib.avt';
    const userUri = 'file:///D:/round165/namespace-user.lib.avt';
    const sources = {
        [ownerUri]: 'namespace Utils { export function convert(value: string): string { return value; } }',
        [userUri]: 'Utils.convert("a");',
    };
    const versions = { [ownerUri]: 1, [userUri]: 1 };
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
    const position = () => files[userUri].file.documentInternal.positionAt(sources[userUri].indexOf('convert') + 1);
    try {
        const first = await service.findDefinition(files[userUri].file, position());
        assert.equal(first?.[0]?.uri, ownerUri);
        assert.equal(files[ownerUri].file.documentInternal.getText(first[0].range), 'convert');

        refresh(ownerUri, 'namespace Utils { export function format(value: string): string { return value; } }');
        const missing = await service.findDefinition(files[userUri].file, position());
        assert.ok(!missing?.some(location => location.uri === ownerUri));

        refresh(userUri, 'Utils.format("a");');
        const found = await service.findDefinition(files[userUri].file, files[userUri].file.documentInternal.positionAt(sources[userUri].indexOf('format') + 1));
        assert.equal(found?.[0]?.uri, ownerUri);
        assert.equal(files[ownerUri].file.documentInternal.getText(found[0].range), 'format');
        const references = await service.onReferences(files[userUri].file, files[userUri].file.documentInternal.positionAt(sources[userUri].indexOf('format') + 1));
        assert.deepEqual(new Set(references.map(item => item.uri)), new Set([ownerUri, userUri]));
    } finally { languageService.dispose(); }
});
