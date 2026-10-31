import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ParserHtml }, { AventusHTMLLanguageService }] = await loadServerModules([
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/LanguageService.ts',
]);

test('HTML snippets follow cursor context through malformed and repaired edits', async () => {
    const uri = 'file:///D:/test/html-snippet-context-round183.wcv.avt';
    const file = { uri, versionUser: 0, documentUser: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const view = { file, tsFile: null, scssFile: null, build, fileParsed: null };
    const service = Object.create(AventusHTMLLanguageService.prototype);
    service.languageService = getLanguageService();

    async function complete(source, marker) {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'Aventus HTML', file.versionUser, source);
        view.fileParsed = ParserHtml.parse(view, build);
        const position = file.documentUser.positionAt(source.indexOf(marker) + marker.length);
        const list = await service.doComplete(view, position);
        return list.items.filter(item => item.label === 'for' || item.label === 'forIn' || item.label === 'forOf');
    }

    const text = await complete('<section>for</section>', 'for');
    assert.deepEqual(text.map(item => item.label), ['for', 'forIn', 'forOf']);
    assert.match(text[0].insertText, /^for\(let /);

    const inTag = await complete('<section for></section>', 'for');
    assert.deepEqual(inTag, []);

    const malformed = await complete('<section><em>for</section>', 'for');
    assert.deepEqual(malformed.map(item => item.label), ['for', 'forIn', 'forOf']);
    assert.ok(view.fileParsed.errors.length > 0);

    const repaired = await complete('<article><p>for</p></article>', 'for');
    assert.deepEqual(view.fileParsed.errors, []);
    assert.deepEqual(repaired.map(item => item.label), ['for', 'forIn', 'forOf']);
});
