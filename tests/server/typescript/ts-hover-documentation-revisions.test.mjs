import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('le survol inter-fichiers renouvelle signature et documentation après éditions puis retrait', async () => {
    const ownerUri = 'file:///D:/round275/owner.lib.avt';
    const userUri = 'file:///D:/round275/user.lib.avt';
    const sources = {
        [ownerUri]: 'namespace Shared {\n/** First version */\nexport function calculate(value: string): string { return value; }\n}',
        [userUri]: 'Shared.calculate("x");',
    };
    const versions = { [ownerUri]: 0, [userUri]: 0 };
    const files = {};
    const refresh = (uri, source) => {
        sources[uri] = source;
        versions[uri]++;
        const document = TextDocument.create(uri, 'typescript', versions[uri], source);
        const file = { uri, documentInternal: document, documentUser: document, contentInternal: source, versionInternal: versions[uri] };
        files[uri] = { file, versionInternal: versions[uri], contentForLanguageService: source };
    };
    for (const [uri, source] of Object.entries(sources)) refresh(uri, source);
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
    service.languageServiceNamespace = languageService;
    service.filesLoaded = files;
    service.filesNeeded = Object.keys(files);
    service.i18nFiles = {};
    service.build = { tsFiles: files };
    const hover = async () => {
        const document = files[userUri].file.documentInternal;
        const offset = document.getText().indexOf('calculate') + 2;
        return service.doHover(files[userUri].file, document.positionAt(offset));
    };
    try {
        let result = await hover();
        assert.match(result?.contents?.value ?? '', /value: string/);
        assert.match(result?.contents?.value ?? '', /First version/);
        assert.equal(files[userUri].file.documentInternal.getText(result.range), 'calculate');

        refresh(ownerUri, '\nnamespace Shared {\n/** Second version */\nexport function calculate(value: number): number { return value; }\n}');
        refresh(userUri, '\nShared.calculate(1);');
        result = await hover();
        assert.match(result?.contents?.value ?? '', /value: number/);
        assert.match(result?.contents?.value ?? '', /Second version/);
        assert.doesNotMatch(result?.contents?.value ?? '', /First version|string/);
        assert.equal(result.range.start.line, 1);

        refresh(ownerUri, 'namespace Shared { export const other = 1; }');
        result = await hover();
        assert.match(result?.contents?.value ?? '', /```typescript\nany\n```/);
        assert.doesNotMatch(result?.contents?.value ?? '', /First version|Second version|value: (string|number)/);
    } finally { languageService.dispose(); }
});
