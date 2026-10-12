import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

function fixture(source) {
    const uri = 'file:///D:/test/optional-completion-round109.lib.avt';
    const document = TextDocument.create(uri, 'typescript', 1, source);
    const file = { uri, documentInternal: document };
    const service = Object.create(AventusTsLanguageService.prototype);
    service.build = { tsFiles: { [uri]: { file } } };
    return { service, file, document };
}

test('optional-chain completion replaces the dot before the partial member exactly once', async () => {
    const source = 'const card = { submit() {} }; card.sub';
    const { service, file, document } = fixture(source);
    service.languageService = {
        getCompletionsAtPosition: () => ({ entries: [{
            name: 'submit', kind: ts.ScriptElementKind.memberFunctionElement,
            sortText: '0', insertText: '?.submit',
        }] }),
    };
    const completion = await service.doComplete(file, document.positionAt(source.length));
    assert.equal(completion.items.length, 1);
    const item = completion.items[0];
    assert.equal(item.textEdit.newText, '?.submit');
    assert.equal(document.getText(item.textEdit.range), 'sub');
    assert.deepEqual(item.additionalTextEdits, [{
        newText: '',
        range: { start: document.positionAt(source.lastIndexOf('.')), end: document.positionAt(source.lastIndexOf('.') + 1) },
    }]);
});

test('optional-chain completion without a preceding dot leaves unrelated text intact', async () => {
    const source = 'const card = { submit() {} }; card sub';
    const { service, file, document } = fixture(source);
    service.languageService = {
        getCompletionsAtPosition: () => ({ entries: [{
            name: 'submit', kind: ts.ScriptElementKind.memberFunctionElement,
            sortText: '0', insertText: '?.submit',
        }] }),
    };
    const item = (await service.doComplete(file, document.positionAt(source.length))).items[0];
    assert.equal(item.textEdit.newText, '?.submit');
    assert.equal(document.getText(item.textEdit.range), 'sub');
    assert.equal(item.additionalTextEdits, undefined);
});

test('completion resolve adds an npm auto-import edit and clears transient metadata', async () => {
    const source = 'const result = someVa';
    const { service, file, document } = fixture(source);
    service.languageService = {
        getCompletionsAtPosition: () => ({ entries: [{
            name: 'someValue', kind: ts.ScriptElementKind.constElement,
            sortText: '0', source: 'sample-package', data: { exportName: 'someValue' },
        }] }),
        getCompletionEntryDetails: () => ({
            displayParts: [{ text: 'const someValue: number', kind: 'text' }], documentation: [],
            codeActions: [{ changes: [{ textChanges: [{ span: { start: 0, length: 0 }, newText: "import { someValue } from 'sample-package';\n" }] }] }],
        }),
    };
    const item = (await service.doComplete(file, document.positionAt(source.length))).items[0];
    const resolved = await service.doResolve(item);
    assert.equal(resolved.detail, 'const someValue: number');
    assert.equal(resolved.additionalTextEdits.length, 1);
    assert.deepEqual(resolved.additionalTextEdits[0].range, { start: document.positionAt(0), end: document.positionAt(0) });
    assert.equal(resolved.additionalTextEdits[0].newText, 'import { someValue } from "sample-package";\n');
    assert.equal(resolved.data, undefined);
});
