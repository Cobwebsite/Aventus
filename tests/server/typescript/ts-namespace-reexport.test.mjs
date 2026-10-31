import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('navigation TS : un réexport de namespace suit le changement du membre et du consommateur', async () => {
    const base = 'file:///D:/round180/';
    const ownerUri = `${base}owner.ts`;
    const barrelUri = `${base}barrel.ts`;
    const consumerUri = `${base}consumer.ts`;
    const sources = {};
    const versions = {};
    const files = {};
    function refresh(uri, source) {
        sources[uri] = source;
        versions[uri] = (versions[uri] ?? 0) + 1;
        const document = TextDocument.create(uri, 'typescript', versions[uri], source);
        const file = { uri, documentInternal: document, documentUser: document, contentInternal: source, versionInternal: versions[uri] };
        files[uri] = { file, versionInternal: versions[uri], contentForLanguageService: source };
    }
    refresh(ownerUri, 'export function send(value: string) { return value; }');
    refresh(barrelUri, 'export * as API from "./owner";');
    refresh(consumerUri, 'import { API } from "./barrel";\nAPI.send("first"); API.send("second");');
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
    const position = (name) => files[consumerUri].file.documentInternal.positionAt(sources[consumerUri].indexOf(`API.${name}`) + 4);
    try {
        const initial = await service.findDefinition(files[consumerUri].file, position('send'));
        assert.equal(initial?.[0]?.uri, ownerUri);
        assert.equal(files[ownerUri].file.documentInternal.getText(initial[0].range), 'send');
        const initialRefs = await service.onReferences(files[consumerUri].file, position('send'));
        assert.deepEqual(initialRefs.map(ref => [ref.uri, files[ref.uri].file.documentInternal.getText(ref.range)]), [
            [ownerUri, 'send'], [consumerUri, 'send'], [consumerUri, 'send'],
        ]);

        refresh(ownerUri, '\nexport function dispatch(value: string) { return value; }');
        const removed = await service.findDefinition(files[consumerUri].file, position('send'));
        assert.ok(!removed?.some(ref => ref.uri === ownerUri));
        refresh(consumerUri, 'import { API } from "./barrel";\nAPI.dispatch("first"); API.dispatch("second");');
        const restored = await service.findDefinition(files[consumerUri].file, position('dispatch'));
        assert.equal(restored?.[0]?.uri, ownerUri);
        assert.equal(restored[0].range.start.line, 1);
        assert.equal(files[ownerUri].file.documentInternal.getText(restored[0].range), 'dispatch');
        const edits = await service.onRename(files[consumerUri].file, position('dispatch'), 'deliver');
        assert.deepEqual(new Set(Object.keys(edits?.changes ?? {})), new Set([ownerUri, consumerUri]));
        assert.deepEqual(edits.changes[ownerUri].map(edit => files[ownerUri].file.documentInternal.getText(edit.range)), ['dispatch']);
        assert.deepEqual(edits.changes[consumerUri].map(edit => files[consumerUri].file.documentInternal.getText(edit.range)), ['dispatch', 'dispatch']);
        assert.ok(Object.values(edits.changes).flat().every(edit => edit.newText === 'deliver'));
    } finally { languageService.dispose(); }
});
