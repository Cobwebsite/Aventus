import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('la définition d’une méthode héritée bascule vers la surcharge enfant puis revient au parent', async () => {
    const parentUri = 'file:///D:/round168/parent.lib.avt';
    const childUri = 'file:///D:/round168/child.lib.avt';
    const userUri = 'file:///D:/round168/user.lib.avt';
    const sources = {
        [parentUri]: 'class Parent { public render(): string { return "parent"; } }',
        [childUri]: 'class Child extends Parent {}',
        [userUri]: 'new Child().render();',
    };
    const versions = Object.fromEntries(Object.keys(sources).map(uri => [uri, 0]));
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
        getScriptVersion: uri => String(versions[uri]),
        getScriptSnapshot: uri => ts.ScriptSnapshot.fromString(sources[uri]),
        getCurrentDirectory: () => '/', getDefaultLibFileName: () => '',
        fileExists: uri => uri in sources, readFile: uri => sources[uri], readDirectory: () => [],
    };
    const languageService = ts.createLanguageService(host);
    const service = Object.create(AventusTsLanguageService.prototype);
    Object.assign(service, {
        languageService, languageServiceNamespace: languageService, filesLoaded: files,
        filesNeeded: Object.keys(files), i18nFiles: {}, build: { tsFiles: files },
    });
    const position = () => files[userUri].file.documentInternal.positionAt(sources[userUri].indexOf('render') + 1);
    try {
        const inherited = await service.findDefinition(files[userUri].file, position());
        assert.equal(inherited?.[0]?.uri, parentUri);
        assert.equal(files[parentUri].file.documentInternal.getText(inherited[0].range), 'render');

        refresh(childUri, '\nclass Child extends Parent { public override render(): string { return "child"; } }');
        const overridden = await service.findDefinition(files[userUri].file, position());
        assert.equal(overridden?.[0]?.uri, childUri);
        assert.equal(overridden[0].range.start.line, 1);
        assert.equal(files[childUri].file.documentInternal.getText(overridden[0].range), 'render');
        const edits = await service.onRename(files[userUri].file, position(), 'draw');
        assert.deepEqual(new Set(Object.keys(edits?.changes ?? {})), new Set([parentUri, childUri, userUri]));
        for (const uri of [parentUri, childUri, userUri]) {
            assert.deepEqual(edits.changes[uri].map(edit => files[uri].file.documentInternal.getText(edit.range)), ['render']);
        }
        assert.ok(Object.values(edits.changes).flat().every(edit => edit.newText === 'draw'));

        refresh(childUri, 'class Child extends Parent {}');
        const restored = await service.findDefinition(files[userUri].file, position());
        assert.equal(restored?.[0]?.uri, parentUri);
        assert.equal(files[parentUri].file.documentInternal.getText(restored[0].range), 'render');
    } finally { languageService.dispose(); }
});
