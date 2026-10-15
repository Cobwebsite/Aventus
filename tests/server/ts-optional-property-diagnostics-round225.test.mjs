import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('un membre optionnel distant renouvelle ses diagnostics après changement de type et correction du consommateur', () => {
    const modelUri = 'file:///D:/round225/model.lib.avt';
    const consumerUri = 'file:///D:/round225/consumer.lib.avt';
    const sources = {
        [modelUri]: 'namespace Model { export interface Item { label: string } }',
        [consumerUri]: 'declare const item: Model.Item;\nconst title: string = item.label;',
    };
    const versions = { [modelUri]: 1, [consumerUri]: 1 };
    const host = {
        getCompilationSettings: () => ({ noLib: true, strictNullChecks: true, target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true }),
        getScriptFileNames: () => Object.keys(sources), getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: uri => String(versions[uri] ?? 0),
        getScriptSnapshot: uri => sources[uri] === undefined ? undefined : ts.ScriptSnapshot.fromString(sources[uri]),
        getCurrentDirectory: () => '/', getDefaultLibFileName: () => '',
        fileExists: uri => uri in sources, readFile: uri => sources[uri], readDirectory: () => [],
    };
    const languageService = ts.createLanguageService(host);
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageService = languageService;
    const edit = (uri, content) => { sources[uri] = content; versions[uri]++; };
    const diagnostics = () => {
        const document = TextDocument.create(consumerUri, 'typescript', versions[consumerUri], sources[consumerUri]);
        return service.doValidation({ uri: consumerUri, documentInternal: document }).map(item => ({
            message: item.message, text: document.getText(item.range), line: item.range.start.line,
        }));
    };
    try {
        assert.deepEqual(diagnostics(), []);

        edit(modelUri, 'namespace Model { export interface Item { label?: string } }');
        let errors = diagnostics();
        assert.deepEqual(errors.map(item => [item.text, item.line]), [['title', 1]]);
        assert.match(errors[0].message, /undefined.*not assignable.*string/);

        edit(modelUri, 'namespace Model { export interface Item { label?: number } }');
        errors = diagnostics();
        assert.deepEqual(errors.map(item => [item.text, item.line]), [['title', 1]]);
        assert.match(errors[0].message, /number.*not assignable.*string/);

        edit(consumerUri, 'declare const item: Model.Item;\n\nconst title: number | undefined = item.label;');
        assert.deepEqual(diagnostics(), []);

        edit(modelUri, 'namespace Model { export interface Item { label: string } }');
        errors = diagnostics();
        assert.deepEqual(errors.map(item => [item.text, item.line]), [['title', 2]]);
        assert.match(errors[0].message, /string.*not assignable.*number/);
    } finally { languageService.dispose(); }
});
