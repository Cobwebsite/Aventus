import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('les diagnostics de surcharge distante suivent signatures, plages et correction', () => {
    const modelUri = 'file:///D:/round240/overloads.lib.avt';
    const userUri = 'file:///D:/round240/consumer.lib.avt';
    const sources = {
        [modelUri]: 'namespace Conversion { export function parse(value: string): string; export function parse(value: number): number; export function parse(value: string | number): string | number { return value; } }',
        [userUri]: 'const result = Conversion.parse(true);',
    };
    const versions = { [modelUri]: 1, [userUri]: 1 };
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
        const document = TextDocument.create(userUri, 'typescript', versions[userUri], sources[userUri]);
        return service.doValidation({ uri: userUri, documentInternal: document }).map(item => ({
            code: item.code, text: document.getText(item.range), line: item.range.start.line, message: item.message,
        }));
    };
    try {
        let errors = diagnostics();
        assert.deepEqual(errors.map(({ code, text, line }) => [code, text, line]), [[2769, 'true', 0]]);
        assert.match(errors[0].message, /overload/i);

        edit(modelUri, 'namespace Conversion { export function parse(value: string): string; export function parse(value: number): number; export function parse(value: boolean): boolean; export function parse(value: string | number | boolean): string | number | boolean { return value; } }');
        assert.deepEqual(diagnostics(), []);

        edit(modelUri, 'namespace Conversion { export function parse(value: string): string; export function parse(value: number): number; export function parse(value: string | number): string | number { return value; } }');
        edit(userUri, '\n\nconst result = Conversion.parse(true);');
        errors = diagnostics();
        assert.deepEqual(errors.map(({ code, text, line }) => [code, text, line]), [[2769, 'true', 2]]);

        edit(userUri, '\n\nconst result = Conversion.parse(42);');
        assert.deepEqual(diagnostics(), []);
    } finally { languageService.dispose(); }
});
