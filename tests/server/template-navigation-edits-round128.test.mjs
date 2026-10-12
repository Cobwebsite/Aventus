import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTemplateLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/template/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { _extensionPath: process.cwd(), logLevel: 99 };

function fixture(source, version) {
    const uri = 'file:///d%3A/templates/round128/template.avt.ts';
    return {
        uri,
        documentInternal: TextDocument.create(uri, 'typescript', version, source),
        contentInternal: source,
        versionInternal: version,
    };
}

test('template references and rename use the current buffer after successive edits', async () => {
    const service = new AventusTemplateLanguageService();
    const file = fixture('export class Demo { first = 1; run() { return this.first; } }', 1);
    service.addFile(file);
    try {
        const assertNavigation = async (source, version, name) => {
            file.documentInternal = TextDocument.create(file.uri, 'typescript', version, source);
            file.contentInternal = source;
            file.versionInternal = version;
            assert.deepEqual(service.doValidation(file), []);
            const use = file.documentInternal.positionAt(source.lastIndexOf(name) + 1);
            const references = await service.onReferences(file, use);
            assert.deepEqual(references.map(location => file.documentInternal.getText(location.range)), [name, name]);
            const rename = await service.onRename(file, use, 'renamed');
            assert.deepEqual(Object.keys(rename?.changes ?? {}), [file.uri]);
            assert.equal(TextDocument.applyEdits(file.documentInternal, rename.changes[file.uri]), source.replaceAll(name, 'renamed'));
        };
        await assertNavigation(file.contentInternal, 1, 'first');
        await assertNavigation('export class Demo { second = 2; run() { return this.second; } }', 2, 'second');
        await assertNavigation('export class Demo { third = 3; run() { return this.third; } }', 3, 'third');
    } finally {
        service.removeFile(file);
    }
});
