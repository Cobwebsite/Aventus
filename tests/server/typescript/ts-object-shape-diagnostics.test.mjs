import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('les diagnostics de forme objet suivent les propriétés requises et superflues d’une interface distante', () => {
    const modelUri = 'file:///D:/round244/options.lib.avt';
    const userUri = 'file:///D:/round244/consumer.lib.avt';
    const sources = {
        [modelUri]: 'namespace Config { export interface Options { name: string; count: number; } }',
        [userUri]: 'const options: Config.Options = { name: "demo" };',
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
        assert.deepEqual(errors.map(({ code, text, line }) => [code, text, line]), [[2741, 'options', 0]]);
        assert.match(errors[0].message, /count/);

        edit(modelUri, 'namespace Config { export interface Options { name: string; count?: number; } }');
        assert.deepEqual(diagnostics(), []);

        edit(userUri, '\nconst options: Config.Options = { name: "demo", extra: true };');
        errors = diagnostics();
        assert.deepEqual(errors.map(({ code, text, line }) => [code, text, line]), [[2353, 'extra', 1]]);
        assert.match(errors[0].message, /Options/);

        edit(modelUri, 'namespace Config { export interface Options { name: string; count?: number; extra: boolean; } }');
        assert.deepEqual(diagnostics(), []);

        edit(modelUri, 'namespace Config { export interface Options { name: string; count: number; extra: boolean; } }');
        errors = diagnostics();
        assert.deepEqual(errors.map(({ code, text, line }) => [code, text, line]), [[2741, 'options', 1]]);
        edit(userUri, '\nconst options: Config.Options = { name: "demo", count: 2, extra: true };');
        assert.deepEqual(diagnostics(), []);
    } finally { languageService.dispose(); }
});
