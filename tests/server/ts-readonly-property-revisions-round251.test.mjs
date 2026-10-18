import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('une propriété readonly distante actualise le diagnostic après changement du modèle et déplacement de l’écriture', () => {
    const modelUri = 'file:///D:/round251/model.lib.avt';
    const consumerUri = 'file:///D:/round251/consumer.lib.avt';
    const sources = {
        [modelUri]: 'namespace Model { export interface Entry { readonly id: number; } }',
        [consumerUri]: 'declare const entry: Model.Entry;\nentry.id = 2;',
    };
    const versions = { [modelUri]: 1, [consumerUri]: 1 };
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
    const edit = (uri, source) => { sources[uri] = source; versions[uri]++; };
    const diagnostics = () => {
        const document = TextDocument.create(consumerUri, 'typescript', versions[consumerUri], sources[consumerUri]);
        return service.doValidation({ uri: consumerUri, documentInternal: document }).map(item => ({
            code: item.code, text: document.getText(item.range), line: item.range.start.line,
        }));
    };
    try {
        assert.deepEqual(diagnostics(), [{ code: 2540, text: 'id', line: 1 }]);
        edit(modelUri, 'namespace Model { export interface Entry { id: number; } }');
        assert.deepEqual(diagnostics(), []);
        edit(modelUri, 'namespace Model { export interface Entry { readonly id: number; } }');
        assert.deepEqual(diagnostics(), [{ code: 2540, text: 'id', line: 1 }]);
        edit(consumerUri, 'declare const entry: Model.Entry;\n\nentry.id = 3;');
        assert.deepEqual(diagnostics(), [{ code: 2540, text: 'id', line: 2 }]);
        edit(consumerUri, 'declare const entry: Model.Entry;\n\nconst id = entry.id;');
        assert.deepEqual(diagnostics(), []);
    } finally { languageService.dispose(); }
});
