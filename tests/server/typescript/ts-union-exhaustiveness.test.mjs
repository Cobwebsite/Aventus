import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('un type union dans un autre fichier actualise les diagnostics des branches et leurs plages', () => {
    const modelUri = 'file:///D:/round184/model.lib.avt';
    const consumerUri = 'file:///D:/round184/consumer.lib.avt';
    const sources = {
        [modelUri]: 'namespace Model { export type Status = "ready" | "failed"; }',
        [consumerUri]: 'const first: Model.Status = "ready";\nconst second: Model.Status = "failed";',
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
    function edit(uri, content) { sources[uri] = content; versions[uri]++; }
    function diagnostics() {
        const document = TextDocument.create(consumerUri, 'typescript', versions[consumerUri], sources[consumerUri]);
        return service.doValidation({ uri: consumerUri, documentInternal: document }).map(diagnostic => ({
            text: document.getText(diagnostic.range),
            start: diagnostic.range.start,
            end: diagnostic.range.end,
            message: diagnostic.message,
        }));
    }
    try {
        assert.deepEqual(diagnostics(), []);

        edit(modelUri, 'namespace Model { export type Status = "pending" | "done"; }');
        const stale = diagnostics();
        assert.equal(stale.length, 2);
        assert.deepEqual(stale.map(diagnostic => [diagnostic.text, diagnostic.start.line, diagnostic.start.character, diagnostic.end.character]), [
            ['first', 0, 6, 11], ['second', 1, 6, 12],
        ]);
        assert.ok(stale.every(diagnostic => /not assignable to type 'Status'/.test(diagnostic.message)));

        edit(consumerUri, '\nconst first: Model.Status = "pending";\nconst second: Model.Status = "failed";');
        const moved = diagnostics();
        assert.equal(moved.length, 1);
        assert.deepEqual([moved[0].text, moved[0].start.line, moved[0].start.character, moved[0].end.character], ['second', 2, 6, 12]);

        edit(consumerUri, 'const first: Model.Status = "pending";\nconst second: Model.Status = "done";');
        assert.deepEqual(diagnostics(), []);
    } finally { languageService.dispose(); }
});
