import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

function fixture(name, ownerSource, userSource) {
    const ownerUri = `file:///D:/round291/${name}.lib.avt`;
    const userUri = `file:///D:/round291/${name}-user.lib.avt`;
    const sources = { [ownerUri]: ownerSource, [userUri]: userSource };
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
    return {
        edit(uri, source) { sources[uri] = source; versions[uri]++; },
        ownerUri, userUri,
        diagnostics() {
            const document = TextDocument.create(userUri, 'typescript', versions[userUri], sources[userUri]);
            return service.doValidation({ uri: userUri, documentInternal: document }).map(item => ({
                code: item.code, text: document.getText(item.range), line: item.range.start.line, message: item.message,
            }));
        },
        close() { languageService.dispose(); },
    };
}

test('une union discriminée distante renouvelle les valeurs admises et les plages après édition du consommateur', () => {
    const f = fixture('union',
        'namespace Shared { export type Result = { kind: "ready"; value: number } | { kind: "failed"; reason: string }; }',
        'const result: Shared.Result = { kind: "pending", value: 1 };');
    try {
        let errors = f.diagnostics();
        assert.deepEqual(errors.map(({ code, text, line }) => [code, text, line]), [[2322, 'kind', 0]]);
        f.edit(f.ownerUri, 'namespace Shared { export type Result = { kind: "pending"; value: number } | { kind: "failed"; reason: string }; }');
        assert.deepEqual(f.diagnostics(), []);
        f.edit(f.ownerUri, 'namespace Shared { export type Result = { kind: "complete"; value: number } | { kind: "failed"; reason: string }; }');
        errors = f.diagnostics();
        assert.deepEqual(errors.map(({ code, text, line }) => [code, text, line]), [[2322, 'kind', 0]]);
        f.edit(f.userUri, '\nconst result: Shared.Result = { kind: "complete", value: 1 };');
        assert.deepEqual(f.diagnostics(), []);
    } finally { f.close(); }
});

test('une interface distante héritée propage les membres requis puis retire les diagnostics après révision', () => {
    const f = fixture('inheritance',
        'namespace Shared { export interface Base { id: string } export interface Item extends Base { label: string } }',
        'const item: Shared.Item = { label: "one" };');
    try {
        let errors = f.diagnostics();
        assert.deepEqual(errors.map(({ code, text, line }) => [code, text, line]), [[2741, 'item', 0]]);
        assert.match(errors[0].message, /id/);
        f.edit(f.ownerUri, 'namespace Shared { export interface Base { id?: string } export interface Item extends Base { label: string } }');
        assert.deepEqual(f.diagnostics(), []);
        f.edit(f.ownerUri, 'namespace Shared { export interface Base { id: number } export interface Item extends Base { label: string } }');
        errors = f.diagnostics();
        assert.deepEqual(errors.map(({ code, text, line }) => [code, text, line]), [[2741, 'item', 0]]);
        f.edit(f.userUri, '\nconst item: Shared.Item = { id: "bad", label: "one" };');
        errors = f.diagnostics();
        assert.deepEqual(errors.map(({ code, text, line }) => [code, text, line]), [[2322, 'id', 1]]);
        f.edit(f.userUri, '\nconst item: Shared.Item = { id: 4, label: "one" };');
        assert.deepEqual(f.diagnostics(), []);
    } finally { f.close(); }
});
