import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('changer la signature d’une fonction dans un autre fichier actualise les diagnostics du consommateur', () => {
    const ownerUri = 'file:///D:/round167/owner.lib.avt';
    const userUri = 'file:///D:/round167/user.lib.avt';
    const sources = {
        [ownerUri]: 'namespace Shared { export function send(value: string): void {} }',
        [userUri]: 'Shared.send("hello");',
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
    function refresh(uri, text) { sources[uri] = text; versions[uri]++; }
    function diagnostics() {
        const document = TextDocument.create(userUri, 'typescript', versions[userUri], sources[userUri]);
        return service.doValidation({ uri: userUri, documentInternal: document }).map(item => ({
            message: item.message, text: document.getText(item.range), line: item.range.start.line,
        }));
    }
    try {
        assert.deepEqual(diagnostics(), []);
        refresh(ownerUri, 'namespace Shared { export function send(value: number): void {} }');
        const wrong = diagnostics();
        assert.ok(wrong.some(item => /not assignable to parameter of type 'number'/.test(item.message) && item.text === '"hello"'));

        refresh(userUri, '\nShared.send(42);');
        assert.deepEqual(diagnostics(), []);

        refresh(ownerUri, 'namespace Shared { export function dispatch(value: number): void {} }');
        const missing = diagnostics();
        assert.ok(missing.some(item => /Property 'send' does not exist/.test(item.message) && item.text === 'send' && item.line === 1));

        refresh(userUri, 'Shared.dispatch(42);');
        assert.deepEqual(diagnostics(), []);
    } finally { languageService.dispose(); }
});
