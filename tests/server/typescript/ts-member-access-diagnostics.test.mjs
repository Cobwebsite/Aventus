import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('les diagnostics d’accès à un membre entre fichiers suivent les changements de visibilité et de l’usage', () => {
    const ownerUri = 'file:///D:/test/round178-member-access/owner.lib.avt';
    const consumerUri = 'file:///D:/test/round178-member-access/consumer.lib.avt';
    const sources = {
        [ownerUri]: 'namespace Shared { export class Box { private value = 1; } }',
        [consumerUri]: 'const box = new Shared.Box();\nconst current = box.value;',
    };
    const versions = { [ownerUri]: 1, [consumerUri]: 1 };
    const host = {
        getCompilationSettings: () => ({ noLib: true, target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true }),
        getScriptFileNames: () => Object.keys(sources),
        getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: uri => String(versions[uri]),
        getScriptSnapshot: uri => sources[uri] === undefined ? undefined : ts.ScriptSnapshot.fromString(sources[uri]),
        getCurrentDirectory: () => '/', getDefaultLibFileName: () => '',
        fileExists: uri => uri in sources, readFile: uri => sources[uri], readDirectory: () => [],
    };
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageService = ts.createLanguageService(host);
    const validate = () => {
        const document = TextDocument.create(consumerUri, 'typescript', versions[consumerUri], sources[consumerUri]);
        return service.doValidation({ uri: consumerUri, documentInternal: document }).map(diagnostic => ({
            message: diagnostic.message,
            text: document.getText(diagnostic.range),
            range: diagnostic.range,
        }));
    };
    const edit = (uri, source) => { sources[uri] = source; versions[uri]++; };
    try {
        const initial = validate().filter(item => /private/.test(item.message));
        assert.equal(initial.length, 1);
        assert.equal(initial[0].text, 'value');
        assert.deepEqual(initial[0].range.start, { line: 1, character: 20 });

        edit(ownerUri, 'namespace Shared { export class Box { public value = 1; } }');
        assert.deepEqual(validate().filter(item => /private|protected/.test(item.message)), []);

        edit(ownerUri, 'namespace Shared { export class Box { protected value = 1; } }');
        const protectedErrors = validate().filter(item => /protected/.test(item.message));
        assert.equal(protectedErrors.length, 1);
        assert.equal(protectedErrors[0].text, 'value');

        edit(consumerUri, 'const box = new Shared.Box();\nconst current = 3;');
        assert.deepEqual(validate().filter(item => /private|protected/.test(item.message)), []);

        edit(consumerUri, 'const box = new Shared.Box();\nconst current = box.value;');
        assert.equal(validate().filter(item => /protected/.test(item.message)).length, 1);
    } finally {
        service.languageService.dispose();
    }
});
