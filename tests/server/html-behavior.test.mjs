import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

function parse(source, version = 1, uri = 'file:///view.html.avt') {
    const documentUser = TextDocument.create(uri, 'aventus-html', version, source);
    const file = { file: { uri, versionUser: version, documentUser }, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    return ParserHtml.parse(file, build);
}

test('HTML parser reads nested tags, attributes and source positions', () => {
    const source = '<div class="card"><span title="Hello">Hi</span><br/></div>';
    const parsed = parse(source);
    assert.deepEqual(parsed.tags.map(tag => tag.tagName), ['div', 'span', 'br']);
    assert.equal(parsed.tags[1].attributes.title.value, 'Hello');
    assert.equal(parsed.tags[1].parent, parsed.tags[0]);
    assert.equal(parsed.tags[2].selfClosing, true);
    assert.equal(source.slice(parsed.tags[1].start, parsed.tags[1].end), 'span');
});

test('HTML parser caches by document version and reparses after an edit', () => {
    const first = parse('<div></div>', 1, 'file:///cache.html.avt');
    const cached = parse('<span></span>', 1, 'file:///cache.html.avt');
    assert.equal(cached, first);
    const changed = parse('<span></span>', 2, 'file:///cache.html.avt');
    assert.notEqual(changed, first);
    assert.equal(changed.tags[0].tagName, 'span');
});

test('HTML parser reports mismatched closing tags with a source range', () => {
    const parsed = parse('<div><span></div>', 1, 'file:///invalid.html.avt');
    assert.ok(parsed.errors.some(error => error.message.includes("isn't correctly closed")));
    assert.equal(parsed.errors[0].range.start.line, 0);
});

test('HTML parser flags duplicate and deprecated attributes', () => {
    const parsed = parse('<div id="first" id="second" @for="item"></div>', 1, 'file:///attrs.html.avt');
    assert.ok(parsed.errors.some(error => error.message === 'Duplicate attribute id'));
    assert.ok(parsed.errors.some(error => error.message.includes('Deprecated')));
});

test('HTML parser leaves escaped template controls as literal content', () => {
    const parsed = parse('<div>\\{{name}} \\if</div>', 1, 'file:///escaped.html.avt');
    assert.equal(parsed.loops.length, 0);
    assert.equal(parsed.ifs.length, 0);
    assert.equal(parsed.tags[0].tagName, 'div');
});

test('HTML parser separates named blocks and discovers slots', () => {
    const parsed = parse('<block name="header"><h1>Title</h1></block><div><slot name="body"></slot></div>', 1, 'file:///blocks.html.avt');
    assert.match(parsed.blocksInfo.header, /<h1>Title<\/h1>/);
    assert.match(parsed.blocksInfo.default, /<div>/);
    assert.match(parsed.slotsInfo.body, /<slot name="body"><\/slot>/);
});

test('HTML parser renders block and slot metadata as escaped template strings', () => {
    const parsed = parse('<block name="quoted">tick ` here</block><slot></slot>', 1, 'file:///ticks.html.avt');
    assert.match(parsed.getBlocksInfoTxt(), /tick \\` here/);
    assert.match(parsed.getSlotsInfoTxt(), /'default':/);
});
