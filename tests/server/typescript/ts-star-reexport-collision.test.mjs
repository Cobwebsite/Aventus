import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('navigation TS : export étoile, collision et résolution explicite après éditions', async () => {
    const base = 'file:///D:/round202/';
    const first = `${base}first.ts`, second = `${base}second.ts`;
    const barrel = `${base}barrel.ts`, consumer = `${base}consumer.ts`;
    const sources = {}, versions = {}, files = {};
    function refresh(uri, source) {
        sources[uri] = source;
        versions[uri] = (versions[uri] ?? 0) + 1;
        const document = TextDocument.create(uri, 'typescript', versions[uri], source);
        const file = { uri, documentInternal: document, documentUser: document, contentInternal: source, versionInternal: versions[uri] };
        files[uri] = { file, versionInternal: versions[uri], contentForLanguageService: source };
    }
    refresh(first, 'export function make() { return 1; }');
    refresh(second, 'export function other() { return 2; }');
    refresh(barrel, 'export * from "./first";\nexport * from "./second";');
    refresh(consumer, 'import { make } from "./barrel";\nmake();');
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
    Object.assign(service, { languageService, languageServiceNamespace: languageService, filesLoaded: files,
        filesNeeded: Object.keys(files), i18nFiles: {}, build: { tsFiles: files } });
    const position = () => files[consumer].file.documentInternal.positionAt(sources[consumer].lastIndexOf('make') + 1);
    const definition = async () => (await service.findDefinition(files[consumer].file, position())) ?? [];
    try {
        assert.deepEqual(languageService.getSemanticDiagnostics(consumer).map(item => item.code), []);
        assert.equal((await definition())[0]?.uri, first);

        refresh(second, 'export function make() { return 2; }');
        assert.ok(languageService.getSemanticDiagnostics(barrel).some(item => item.code === 2308));
        assert.equal((await definition())[0]?.uri, first);

        refresh(barrel, 'export * from "./first";\nexport * from "./second";\nexport { make } from "./second";');
        assert.deepEqual(languageService.getSemanticDiagnostics(consumer).map(item => item.code), []);
        const resolved = await definition();
        assert.equal(resolved[0]?.uri, second);
        assert.equal(files[second].file.documentInternal.getText(resolved[0].range), 'make');
    } finally { languageService.dispose(); }
});
