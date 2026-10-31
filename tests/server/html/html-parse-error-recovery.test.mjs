import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('une fermeture HTML invalide renouvelle erreurs et expressions après deux corrections du même document', () => {
    const uri = 'file:///D:/round158/error-recovery.html.avt';
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const firstText = '<section><button :title="oldTitle" @click="oldAction()">Go</section>';
    const first = parse(firstText);
    assert.ok(first.errors.length > 0);
    assert.equal(first.injections[0].injectTsTxt, 'oldTitle');
    assert.ok(first.interestPoints.some(point => point.name === 'oldAction()'));

    const repairedText = '\n<article><button :title="newTitle" @click="newAction()">Go</button></article>';
    const repaired = parse(repairedText);
    assert.deepEqual(repaired.errors, []);
    assert.equal(repaired.injections.length, 1);
    assert.equal(repaired.injections[0].injectTsTxt, 'newTitle');
    assert.equal(repairedText.slice(repaired.injections[0].start, repaired.injections[0].end), '"newTitle"');
    assert.ok(repaired.interestPoints.some(point => point.name === 'newAction()'));
    assert.ok(!repaired.interestPoints.some(point => point.name === 'oldAction()'));

    const wrongCloseText = '\n<div><button :title="finalTitle">Go</button></span>';
    const wrongClose = parse(wrongCloseText);
    assert.ok(wrongClose.errors.length > 0);
    assert.equal(wrongClose.injections.length, 1);
    assert.equal(wrongClose.injections[0].injectTsTxt, 'finalTitle');
    assert.equal(wrongCloseText.slice(wrongClose.injections[0].start, wrongClose.injections[0].end), '"finalTitle"');
    assert.ok(!wrongClose.interestPoints.some(point => point.name === 'newAction()'));
});
