import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ParserHtml }, { AventusHTMLLanguageService }] = await loadServerModules([
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/LanguageService.ts',
]);

test('les suggestions HTML suivent trois éditions, même quand le document redevient mal formé', async () => {
    const uri = 'file:///D:/round149/edit-cycle.html.avt';
    const file = { uri, versionUser: 0, documentUser: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const view = { file, tsFile: null, scssFile: null, build, fileParsed: null };
    const service = Object.create(AventusHTMLLanguageService.prototype);
    service.extenalDocumentation = {};
    service.internalDocumentation = {};
    service.internalDocumentationReverse = {};
    service.internalTagUri = {};
    service._allowRebuildDefinition = true;
    service.rebuildDefinition();
    service.languageService = getLanguageService({ customDataProviders: [service.defaultProvider()] });

    async function inspect(source) {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'Aventus HTML', file.versionUser, source);
        view.fileParsed = ParserHtml.parse(view, build);
        const position = file.documentUser.positionAt(source.indexOf('hr') + 2);
        const completions = await service.doComplete(view, position);
        const hover = await service.doHover(view, file.documentUser.positionAt(source.indexOf('<a ') + 1));
        return { completions, hover, errors: view.fileParsed.errors };
    }

    const malformed = await inspect('<div><a hr></div>');
    assert.ok(malformed.errors.length > 0);
    assert.ok(malformed.completions.items.some(item => item.label === 'href'));
    assert.match(JSON.stringify(malformed.hover?.contents), /anchor|hyperlink|href/i);

    const repaired = await inspect('<div><a hr></a></div>');
    assert.deepEqual(repaired.errors, []);
    assert.ok(repaired.completions.items.some(item => item.label === 'href'));
    assert.match(JSON.stringify(repaired.hover?.contents), /anchor|hyperlink|href/i);

    const malformedAgain = await inspect('<section><a hr></div>');
    assert.ok(malformedAgain.errors.length > 0);
    assert.ok(malformedAgain.completions.items.some(item => item.label === 'href'));
    assert.match(JSON.stringify(malformedAgain.hover?.contents), /anchor|hyperlink|href/i);
});
