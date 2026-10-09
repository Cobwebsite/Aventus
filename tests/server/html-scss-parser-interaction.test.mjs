import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ParserHtml }, { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }] = await loadServerModules([
    'language-services/html/parser/ParserHtml.ts',
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
]);

let sequence = 0;
function fixture(htmlText, cssText) {
    const suffix = ++sequence;
    const viewUri = `file:///D:/test/round2-${suffix}.html.avt`;
    const styleUri = `file:///D:/test/round2-${suffix}.scss.avt`;
    const view = TextDocument.create(viewUri, 'aventus-html', 1, htmlText);
    const style = TextDocument.create(styleUri, 'scss', 1, cssText);
    const css = new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });
    const htmlFile = {
        file: { uri: viewUri, versionUser: 1, documentUser: view },
        scssFile: { file: { uri: styleUri, documentUser: style }, rules: css.getRules({ documentUser: style }) },
        tsFile: null,
    };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    return { parsed: ParserHtml.parse(htmlFile, build), htmlFile, build, view, style };
}

test('HTML parser links class selectors from real SCSS rules to the matching view', () => {
    const { parsed, view, style } = fixture('<div class="card active"><span class="other"></span></div>', '.card { color: red; }');
    assert.ok(parsed.styleLinks.length > 0);
    assert.ok(parsed.styleLinks.some(([viewRange, styleRange]) =>
        view.getText().slice(viewRange.start, viewRange.end).includes('class="card active"') &&
        style.getText().slice(styleRange.start, styleRange.end) === '.card'));
});

test('HTML parser refreshes style links when SCSS rules change without reparsing the view', () => {
    const { parsed, htmlFile, build, view } = fixture('<div class="card"></div>', '.card { color: red; }');
    assert.ok(parsed.styleLinks.some(([range]) => view.getText().slice(range.start, range.end).includes('class="card"')));
    htmlFile.scssFile.rules = new Map();
    ParserHtml.refreshStyle(htmlFile, build);
    assert.equal(ParserHtml.parse(htmlFile, build), parsed);
    assert.deepEqual(parsed.styleLinks, []);
});

test('HTML parser records injections, bindings and event references with source positions', () => {
    const source = '<demo-card :title="label" @bind-value="value" @click="submit"></demo-card>';
    const { parsed } = fixture(source, '');
    assert.equal(parsed.injections.length, 1);
    assert.equal(parsed.bindings.length, 1);
    assert.equal(parsed.injections[0].injectTsTxt, 'label');
    assert.equal(parsed.bindings[0].injectTsTxt, 'value');
    assert.ok(parsed.interestPoints.some(point => point.type === 'method' && point.name === 'submit'));
    assert.ok(parsed.interestPoints.some(point => point.type === 'event' && point.name === 'click'));
});

test('HTML parser reports reserved internal attributes and unmatched closing tags', () => {
    const { parsed } = fixture('<div _id="manual"></div></orphan>', '');
    assert.ok(parsed.errors.some(error => error.message.includes('used by Aventus internally')));
    assert.ok(parsed.errors.some(error => error.message.includes('No opening tag found for orphan')));
});
