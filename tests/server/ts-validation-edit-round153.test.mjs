import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

function fixture() {
    const uri = `file:///D:/test/ts-validation-edit-round153-${process.pid}.lib.avt`;
    let source = '';
    let version = 0;
    const host = {
        getCompilationSettings: () => ({ target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true }),
        getScriptFileNames: () => [uri],
        getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: name => name === uri ? String(version) : '1',
        getScriptSnapshot: name => {
            const content = name === uri ? source : ts.sys.readFile(name);
            return content === undefined ? undefined : ts.ScriptSnapshot.fromString(content);
        },
        getCurrentDirectory: () => '/',
        getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
        fileExists: name => name === uri || ts.sys.fileExists(name),
        readFile: name => name === uri ? source : ts.sys.readFile(name),
        readDirectory: ts.sys.readDirectory,
    };
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageService = ts.createLanguageService(host);
    return text => {
        source = text;
        version++;
        const document = TextDocument.create(uri, 'typescript', version, source);
        return service.doValidation({ uri, documentInternal: document }).map(diagnostic => ({
            message: diagnostic.message,
            severity: diagnostic.severity,
            text: document.getText(diagnostic.range),
            range: diagnostic.range,
        }));
    };
}

test('les diagnostics syntaxiques et sémantiques TS se renouvellent après trois éditions', () => {
    const validate = fixture();
    const syntax = validate('const count = ;');
    assert.ok(syntax.some(item => item.severity === DiagnosticSeverity.Error && /Expression expected/.test(item.message)));

    const semantic = validate('const count: number = missingValue;');
    assert.equal(semantic.some(item => /Expression expected/.test(item.message)), false);
    const missing = semantic.find(item => /Cannot find name 'missingValue'/.test(item.message));
    assert.ok(missing);
    assert.equal(missing.text, 'missingValue');
    assert.equal(missing.range.start.character, 22);

    const repaired = validate('const missingValue = 2;\nconst count: number = missingValue;');
    assert.deepEqual(repaired, []);
    const brokenAgain = validate('const missingValue = 2;\nconst count: number = otherValue;');
    assert.equal(brokenAgain.filter(item => /Cannot find name/.test(item.message)).length, 1);
    assert.equal(brokenAgain.find(item => /Cannot find name/.test(item.message)).text, 'otherValue');
});
