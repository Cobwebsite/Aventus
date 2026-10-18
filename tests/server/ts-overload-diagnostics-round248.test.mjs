import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('les diagnostics d’appels surchargés suivent les signatures distantes et les éditions du consommateur', () => {
    const ownerUri = 'file:///D:/round248/overloads.lib.avt';
    const userUri = 'file:///D:/round248/consumer.lib.avt';
    const sources = {
        [ownerUri]: 'namespace Convert { export function parse(value: string): string; export function parse(value: number): number; export function parse(value: string | number): string | number { return value; } }',
        [userUri]: 'const first = Convert.parse("a");\nconst second = Convert.parse(2);',
    };
    const versions = { [ownerUri]: 1, [userUri]: 1 };
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
            code: item.code, text: document.getText(item.range), line: item.range.start.line,
        }));
    };
    try {
        assert.deepEqual(diagnostics(), []);

        edit(ownerUri, 'namespace Convert { export function parse(value: boolean): boolean; export function parse(value: number): number; export function parse(value: boolean | number): boolean | number { return value; } }');
        assert.deepEqual(diagnostics(), [{ code: 2769, text: '"a"', line: 0 }]);

        edit(userUri, '\nconst first = Convert.parse(true);\nconst second = Convert.parse(2);');
        assert.deepEqual(diagnostics(), []);

        edit(ownerUri, 'namespace Convert { export function parse(value: boolean): boolean; export function parse(value: string): string; export function parse(value: boolean | string): boolean | string { return value; } }');
        assert.deepEqual(diagnostics(), [{ code: 2769, text: '2', line: 2 }]);

        edit(userUri, '\nconst first = Convert.parse(true);\nconst second = Convert.parse("b");');
        assert.deepEqual(diagnostics(), []);
    } finally { languageService.dispose(); }
});
