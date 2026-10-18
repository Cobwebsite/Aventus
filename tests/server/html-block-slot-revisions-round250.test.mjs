import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('les métadonnées de blocs et slots suivent deux révisions de vue sans anciennes clés', () => {
    const uri = `file:///D:/test/html-block-slot-revisions-round250-${process.pid}.html.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const first = parse('<block name="header"><h1>Old</h1></block><slot name="body"></slot>');
    assert.deepEqual(first.errors, []);
    assert.deepEqual(Object.keys(first.blocksInfo), ['header', 'default']);
    assert.deepEqual(Object.keys(first.slotsInfo), ['body']);
    assert.match(first.getBlocksInfoTxt(), /Old/);

    const second = parse('<block name="footer"><p>New</p></block><slot name="aside"></slot>');
    assert.deepEqual(second.errors, []);
    assert.deepEqual(Object.keys(second.blocksInfo), ['footer', 'default']);
    assert.deepEqual(Object.keys(second.slotsInfo), ['aside']);
    assert.match(second.getBlocksInfoTxt(), /New/);
    assert.doesNotMatch(second.getBlocksInfoTxt() + second.getSlotsInfoTxt(), /Old|header|body/);

    const final = parse('<div>Plain</div>');
    assert.deepEqual(final.errors, []);
    assert.deepEqual(Object.keys(final.blocksInfo), ['default']);
    assert.deepEqual(Object.keys(final.slotsInfo), []);
    assert.doesNotMatch(final.getBlocksInfoTxt() + final.getSlotsInfoTxt(), /footer|aside|New/);
});
