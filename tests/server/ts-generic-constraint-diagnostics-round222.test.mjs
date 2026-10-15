import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('une contrainte générique distante renouvelle les diagnostics du consommateur après chaque édition', () => {
    const ownerUri = 'file:///D:/round222/contract.lib.avt';
    const userUri = 'file:///D:/round222/consumer.lib.avt';
    const sources = {
        [ownerUri]: 'namespace Contracts { export interface Entity { id: string } export function select<T extends Entity>(value: T): T { return value; } }',
        [userUri]: 'Contracts.select({ id: "ok" });\nContracts.select({ id: 42 });',
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
    function edit(uri, content) { sources[uri] = content; versions[uri]++; }
    function diagnostics() {
        const document = TextDocument.create(userUri, 'typescript', versions[userUri], sources[userUri]);
        return service.doValidation({ uri: userUri, documentInternal: document }).map(item => ({
            code: item.code, message: item.message,
            text: document.getText(item.range), line: item.range.start.line,
        }));
    }
    try {
        let errors = diagnostics();
        assert.deepEqual(errors.filter(item => /number.*not assignable.*string/.test(item.message)).map(item => [item.text, item.line]), [['id', 1]]);

        edit(ownerUri, 'namespace Contracts { export interface Entity { id: number } export function select<T extends Entity>(value: T): T { return value; } }');
        errors = diagnostics();
        assert.deepEqual(errors.filter(item => /string.*not assignable.*number/.test(item.message)).map(item => [item.text, item.line]), [['id', 0]]);
        assert.equal(errors.length, 1);

        edit(userUri, '\nContracts.select({ id: 7 });\nContracts.select({ id: 42 });');
        assert.deepEqual(diagnostics(), []);

        edit(ownerUri, 'namespace Contracts { export interface Entity { id: string } export function select<T extends Entity>(value: T): T { return value; } }');
        errors = diagnostics();
        assert.deepEqual(errors.filter(item => /number.*not assignable.*string/.test(item.message)).map(item => [item.text, item.line]), [['id', 1], ['id', 2]]);
    } finally { languageService.dispose(); }
});
