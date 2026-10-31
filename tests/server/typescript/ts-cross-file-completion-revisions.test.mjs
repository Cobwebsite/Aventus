import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('completion and resolved details follow revisions of an interface in another file', async () => {
    const ownerUri = 'file:///D:/round228/card-owner.lib.avt';
    const userUri = 'file:///D:/round228/card-user.lib.avt';
    const sources = {
        [ownerUri]: 'interface Card { title: string; }',
        [userUri]: 'declare const card: Card;\ncard.',
    };
    const versions = { [ownerUri]: 1, [userUri]: 1 };
    const files = {};
    function refresh(uri, source) {
        sources[uri] = source;
        versions[uri]++;
        const document = TextDocument.create(uri, 'typescript', versions[uri], source);
        files[uri] = { file: { uri, documentInternal: document }, versionInternal: versions[uri], contentForLanguageService: source };
    }
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
    service.filesLoaded = files;
    service.filesNeeded = Object.keys(files);
    service.build = { tsFiles: files };
    async function complete() {
        const file = files[userUri].file;
        return service.doComplete(file, file.documentInternal.positionAt(sources[userUri].length));
    }
    try {
        const initial = await complete();
        assert.deepEqual(initial.items.map(item => item.label), ['title']);
        const resolvedInitial = await service.doResolve(initial.items[0]);
        assert.match(resolvedInitial.detail, /title: string/);

        refresh(ownerUri, 'interface Card { label: number; }');
        const changed = await complete();
        assert.deepEqual(changed.items.map(item => item.label), ['label']);
        const resolvedChanged = await service.doResolve(changed.items[0]);
        assert.match(resolvedChanged.detail, /label: number/);
        assert.equal(resolvedChanged.data, undefined);

        refresh(ownerUri, 'interface Card {}');
        assert.deepEqual((await complete()).items.map(item => item.label), []);
    } finally { languageService.dispose(); }
});
