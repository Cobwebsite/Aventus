import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('définition et renommage d’une propriété d’interface suivent les éditions des deux fichiers', async () => {
    const ownerUri = 'file:///D:/round160/interface-owner.lib.avt';
    const userUri = 'file:///D:/round160/interface-user.lib.avt';
    const sources = {
        [ownerUri]: 'interface Card { title: string; }',
        [userUri]: 'declare const card: Card;\ncard.title;',
    };
    const versions = { [ownerUri]: 0, [userUri]: 0 };
    const files = {};
    const refresh = (uri, source) => {
        sources[uri] = source;
        versions[uri]++;
        const document = TextDocument.create(uri, 'typescript', versions[uri], source);
        const file = { uri, documentInternal: document, documentUser: document, contentInternal: source, versionInternal: versions[uri] };
        files[uri] = { file, versionInternal: versions[uri], contentForLanguageService: source };
    };
    for (const [uri, source] of Object.entries(sources)) refresh(uri, source);
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
    const position = name => {
        const document = files[userUri].file.documentInternal;
        return document.positionAt(document.getText().lastIndexOf(name) + 1);
    };
    try {
        const first = await service.findDefinition(files[userUri].file, position('title'));
        assert.equal(first?.[0]?.uri, ownerUri);
        assert.equal(files[ownerUri].file.documentInternal.getText(first[0].range), 'title');

        refresh(ownerUri, '\ninterface Card { label: string; }');
        refresh(userUri, 'declare const card: Card;\ncard.label;');
        const next = await service.findDefinition(files[userUri].file, position('label'));
        assert.equal(next?.[0]?.uri, ownerUri);
        assert.equal(files[ownerUri].file.documentInternal.getText(next[0].range), 'label');
        assert.equal(next[0].range.start.line, 1);

        const edits = await service.onRename(files[userUri].file, position('label'), 'caption');
        assert.deepEqual(new Set(Object.keys(edits?.changes ?? {})), new Set([ownerUri, userUri]));
        assert.deepEqual(edits.changes[ownerUri].map(edit => files[ownerUri].file.documentInternal.getText(edit.range)), ['label']);
        assert.deepEqual(edits.changes[userUri].map(edit => files[userUri].file.documentInternal.getText(edit.range)), ['label']);
    } finally { languageService.dispose(); }
});
