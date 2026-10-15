import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('navigation TS : un réexport renommé suit les éditions du barrel et du consommateur', async () => {
    const base = 'file:///D:/round173/';
    const ownerUri = `${base}owner.ts`;
    const barrelUri = `${base}barrel.ts`;
    const consumerUri = `${base}consumer.ts`;
    const sources = {
        [ownerUri]: 'export class Card { label = "ready"; }',
        [barrelUri]: 'export { Card as PublicCard } from "./owner";',
        [consumerUri]: 'import { PublicCard } from "./barrel";\nnew PublicCard().label;',
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
        getCompilationSettings: () => ({ noLib: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, allowNonTsExtensions: true }),
        getScriptFileNames: () => Object.keys(sources), getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: uri => String(versions[uri]),
        getScriptSnapshot: uri => sources[uri] === undefined ? undefined : ts.ScriptSnapshot.fromString(sources[uri]),
        getCurrentDirectory: () => '/', getDefaultLibFileName: () => '',
        fileExists: uri => uri in sources, readFile: uri => sources[uri], readDirectory: () => [],
        resolveModuleNames: (names, containingFile) => names.map(name => {
            const uri = new URL(`${name}.ts`, containingFile).href;
            return uri in sources ? { resolvedFileName: uri, extension: ts.Extension.Ts } : undefined;
        }),
    };
    const languageService = ts.createLanguageService(host);
    const service = Object.create(AventusTsLanguageService.prototype);
    Object.assign(service, {
        languageService, languageServiceNamespace: languageService, filesLoaded: files,
        filesNeeded: Object.keys(files), i18nFiles: {}, build: { tsFiles: files },
    });
    const callPosition = () => files[consumerUri].file.documentInternal.positionAt(sources[consumerUri].lastIndexOf(sources[consumerUri].includes('DisplayCard') ? 'DisplayCard' : 'PublicCard') + 2);
    try {
        assert.deepEqual(languageService.getSemanticDiagnostics(consumerUri).map(item => item.messageText), []);
        const initial = await service.findDefinition(files[consumerUri].file, callPosition());
        assert.equal(initial?.[0]?.uri, ownerUri);
        assert.equal(files[ownerUri].file.documentInternal.getText(initial[0].range), 'Card');

        refresh(barrelUri, 'export { Card as DisplayCard } from "./owner";');
        refresh(consumerUri, 'import { DisplayCard } from "./barrel";\nnew DisplayCard().label;');
        const edited = await service.findDefinition(files[consumerUri].file, callPosition());
        assert.equal(edited?.[0]?.uri, ownerUri);
        assert.equal(files[ownerUri].file.documentInternal.getText(edited[0].range), 'Card');
        const edits = await service.onRename(files[consumerUri].file, callPosition(), 'Tile');
        assert.ok(edits?.changes?.[consumerUri]?.some(edit => files[consumerUri].file.documentInternal.getText(edit.range) === 'DisplayCard'));
        assert.ok(Object.values(edits.changes).flat().every(edit => edit.newText === 'Tile'));
    } finally { languageService.dispose(); }
});
