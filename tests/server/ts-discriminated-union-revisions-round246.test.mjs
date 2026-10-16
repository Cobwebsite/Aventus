import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('une union discriminée distante renouvelle ses diagnostics après modification des branches', () => {
    const modelUri = 'file:///D:/round246/events.lib.avt';
    const userUri = 'file:///D:/round246/consumer.lib.avt';
    const sources = {
        [modelUri]: 'namespace Events { export type Event = { kind: "click"; x: number } | { kind: "key"; key: number }; }',
        [userUri]: 'function read(event: Events.Event): number { if (event.kind === "click") return event.x; return event.key; }',
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
        return service.doValidation({ uri: userUri, documentInternal: document })
            .map(item => ({ code: item.code, text: document.getText(item.range), line: item.range.start.line }));
    };
    try {
        assert.deepEqual(diagnostics(), []);
        edit(modelUri, 'namespace Events { export type Event = { kind: "click"; x: number } | { kind: "key"; code: number }; }');
        assert.deepEqual(diagnostics(), [{ code: 2339, text: 'key', line: 0 }]);
        edit(userUri, '\nfunction read(event: Events.Event): number { if (event.kind === "click") return event.x; return event.code; }');
        assert.deepEqual(diagnostics(), []);
        edit(modelUri, 'namespace Events { export type Event = { kind: "click"; position: number } | { kind: "key"; code: number }; }');
        assert.deepEqual(diagnostics(), [{ code: 2339, text: 'x', line: 1 }]);
        edit(userUri, '\nfunction read(event: Events.Event): number { if (event.kind === "click") return event.position; return event.code; }');
        assert.deepEqual(diagnostics(), []);
    } finally { languageService.dispose(); }
});
