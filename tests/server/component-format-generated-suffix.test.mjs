import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusWebComponentLogicalFile }] = await loadServerModules([
    'language-services/ts/component/File.ts',
]);

test('component formatting maps edits after generated methods back to the user suffix', async () => {
    const uri = 'file:///D:/test/Scrollable.wcl.avt';
    const userText = 'namespace Layout {\n    class Scrollable {\n    }\n}\n';
    const generatedText = '        private generated(): void {}\n';
    const insertion = userText.indexOf('    }');
    const internalText = userText.slice(0, insertion) + generatedText + userText.slice(insertion);
    const documentUser = TextDocument.create(uri, 'typescript', 1, userText);
    const documentInternal = TextDocument.create(uri, 'typescript', 2, internalText);
    const editStart = internalText.indexOf('    }');
    const component = Object.create(AventusWebComponentLogicalFile.prototype);
    component._file = {
        uri,
        documentUser,
        documentInternal,
        contentUser: userText,
        contentInternal: internalText,
    };
    component.viewGeneratedStart = insertion;
    component.viewGeneratedEnd = insertion + generatedText.length;
    component.viewUserSuffixEnd = internalText.length;
    component.viewMethodsInfo = [];
    component._build = { htmlFiles: {}, tsLanguageService: {
        format: async () => [{
            range: { start: documentInternal.positionAt(editStart), end: documentInternal.positionAt(editStart + 4) },
            newText: '    ',
        }],
    } };

    const edits = await component.onFormatting(component.file, null, { tabSize: 4, insertSpaces: true });
    assert.equal(edits.length, 1);
    assert.equal(documentUser.offsetAt(edits[0].range.start), insertion);
    assert.equal(TextDocument.applyEdits(documentUser, edits), userText);
});
