import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTemplateLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/template/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { _extensionPath: process.cwd(), logLevel: 99 };

function fixture(source, version = 1) {
    const uri = 'file:///d%3A/templates/round91/template.avt.ts';
    return {
        uri,
        documentInternal: TextDocument.create(uri, 'typescript', version, source),
        contentInternal: source,
        versionInternal: version,
    };
}

test('template script offers a spelling fix for a member error and clears it after applying the edit', async () => {
    const service = new AventusTemplateLanguageService();
    const source = 'export class Demo { value = 1; run() { return this.valuee; } }';
    const file = fixture(source);
    service.addFile(file);
    try {
        const diagnostic = service.doValidation(file).find(item => /valuee/.test(item.message));
        assert.ok(diagnostic);
        assert.equal(file.documentInternal.getText(diagnostic.range), 'valuee');

        const actions = await service.doCodeAction(file, diagnostic.range);
        const fixed = actions.map(action => {
            const edits = action.edit?.changes?.[file.uri] ?? [];
            return TextDocument.applyEdits(file.documentInternal, edits);
        });
        assert.ok(fixed.includes(source.replace('valuee', 'value')), JSON.stringify(actions));

        const corrected = fixed.find(text => text === source.replace('valuee', 'value'));
        file.documentInternal = TextDocument.create(file.uri, 'typescript', 2, corrected);
        file.contentInternal = corrected;
        file.versionInternal = 2;
        assert.deepEqual(service.doValidation(file), []);
    } finally {
        service.removeFile(file);
    }
});

test('template script code actions ignore unused symbols and return no edit for a clean range', async () => {
    const service = new AventusTemplateLanguageService();
    const file = fixture('export class Demo { run() { const unused = 1; return 2; } }');
    service.addFile(file);
    try {
        const unused = service.doValidation(file).find(item => /unused/.test(item.message));
        assert.ok(unused);
        const actions = await service.doCodeAction(file, unused.range);
        assert.deepEqual(actions, []);

        const clean = fixture('export class Demo { run() { return 2; } }', 2);
        file.documentInternal = clean.documentInternal;
        file.contentInternal = clean.contentInternal;
        file.versionInternal = clean.versionInternal;
        assert.deepEqual(service.doValidation(file), []);
        assert.deepEqual(await service.doCodeAction(file, { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } }), []);
    } finally {
        service.removeFile(file);
    }
});
