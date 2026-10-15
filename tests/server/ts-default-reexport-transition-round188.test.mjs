import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('réexport default TS : navigation et diagnostics suivent le remplacement de la source', async () => {
    const base = 'file:///D:/round188/default-reexport/';
    const ownerUri = `${base}owner.ts`;
    const barrelUri = `${base}barrel.ts`;
    const consumerUri = `${base}consumer.ts`;
    const sources = {
        [ownerUri]: 'export default class Card { title = "ready"; }',
        [barrelUri]: 'export { default as PublicCard } from "./owner";',
        [consumerUri]: 'import { PublicCard } from "./barrel";\nnew PublicCard().title;',
    };
    const versions = Object.fromEntries(Object.keys(sources).map(uri => [uri, 1]));
    const files = {};
    function refresh(uri, source) {
        sources[uri] = source;
        versions[uri]++;
        const document = TextDocument.create(uri, 'typescript', versions[uri], source);
        const file = { uri, documentInternal: document, documentUser: document, contentInternal: source, versionInternal: versions[uri] };
        files[uri] = { file, versionInternal: versions[uri], contentForLanguageService: source };
    }
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
    const position = () => files[consumerUri].file.documentInternal.positionAt(sources[consumerUri].lastIndexOf('PublicCard') + 2);
    const definition = async () => (await service.findDefinition(files[consumerUri].file, position()))?.[0];
    const diagnostics = () => languageService.getSemanticDiagnostics(consumerUri).map(item => ts.flattenDiagnosticMessageText(item.messageText, '\n'));
    try {
        assert.deepEqual(diagnostics(), []);
        assert.equal((await definition())?.uri, ownerUri);

        refresh(ownerUri, 'export default class Card { caption = "edited"; }');
        assert.equal((await definition())?.uri, ownerUri);
        assert.ok(diagnostics().some(message => /title/.test(message)));

        refresh(consumerUri, 'import { PublicCard } from "./barrel";\nnew PublicCard().caption;');
        assert.deepEqual(diagnostics(), []);
        assert.equal((await definition())?.uri, ownerUri);
    } finally { languageService.dispose(); }
});
