import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { AventusHTMLLanguageService }, { AventusI18nLanguageService }, { I18nParser }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/html/LanguageService.ts',
    'language-services/i18n/LanguageService.ts',
    'language-services/i18n/Parser.ts',
]);

function htmlService() {
    const service = Object.create(AventusHTMLLanguageService.prototype);
    service.extenalDocumentation = {};
    service.internalDocumentation = {};
    service.internalDocumentationReverse = {};
    service.internalTagUri = {};
    service._allowRebuildDefinition = true;
    service.rebuildDefinition();
    service.languageService = getLanguageService({ customDataProviders: [service.defaultProvider()] });
    return service;
}

function i18nFile(content, version = 1) {
    const documentUser = TextDocument.create('file:///messages.i18n.avt', 'json', version, content);
    return {
        file: { uri: documentUser.uri, documentUser, contentUser: content },
        parsedSrc: JSON.parse(content),
        parsed: I18nParser.parse(documentUser),
        build: { buildConfig: { i18n: { locales: ['en', 'fr'] } } },
    };
}

test('HTML component attribute completion uses declared values and boolean insertion', async () => {
    const service = htmlService();
    service.addExternalDefinition('file:///library', {
        'demo-card': {
            name: 'demo-card', class: 'Card', description: 'Card',
            attributes: {
                selected: { name: 'selected', description: 'Selection', type: 'boolean', values: [] },
                size: { name: 'size', description: 'Size', values: [{ name: 'large', description: 'Large size' }] },
            },
        },
    });
    const document = TextDocument.create('file:///card.html.avt', 'Aventus HTML', 1, '<demo-card sel');
    const file = { file: { documentUser: document }, fileParsed: null };
    const result = await service.doComplete(file, document.positionAt(document.getText().length));
    const selected = result.items.find(item => item.label === 'selected');
    assert.ok(selected);
    assert.ok(selected.textEdit);
    assert.ok(!selected.textEdit.newText.includes('='));
    assert.equal(service.provideValues('demo-card', 'size')[0].name, 'large');
});

test('HTML completion removes a component after its external definition is unloaded', async () => {
    const service = htmlService();
    service.addExternalDefinition('file:///library', {
        'demo-card': { name: 'demo-card', class: 'Card', description: 'Card', attributes: {} },
    });
    const document = TextDocument.create('file:///view.html.avt', 'Aventus HTML', 1, '<demo-');
    const file = { file: { documentUser: document }, fileParsed: null };
    const position = document.positionAt(document.getText().length);
    assert.ok((await service.doComplete(file, position)).items.some(item => item.label === 'demo-card'));
    service.removeExternalDefinition('file:///library');
    assert.ok(!(await service.doComplete(file, position)).items.some(item => item.label === 'demo-card'));
});

test('i18n diagnostics and missing-locale action clear after a content update', async () => {
    const service = AventusI18nLanguageService.getInstance();
    const incomplete = i18nFile('{"hello":{"en":"Hello"}}');
    assert.ok((await service.validate(incomplete)).some(item => item.message.includes('Missing locales fr')));
    assert.equal((await service.codeAction(incomplete, null)).length, 1);
    const updated = i18nFile('{"hello":{"en":"Hello","fr":"Bonjour"}}', 2);
    assert.deepEqual(await service.validate(updated), []);
    assert.deepEqual(await service.codeAction(updated, null), []);
});
