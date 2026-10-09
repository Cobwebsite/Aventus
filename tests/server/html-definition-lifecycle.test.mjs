import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { AventusHTMLLanguageService }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/html/LanguageService.ts',
]);

function service() {
    const result = Object.create(AventusHTMLLanguageService.prototype);
    result.extenalDocumentation = {};
    result.internalDocumentation = {};
    result.internalDocumentationReverse = {};
    result.internalTagUri = {};
    result._allowRebuildDefinition = true;
    result.rebuildDefinition();
    result.languageService = getLanguageService({ customDataProviders: [result.defaultProvider()] });
    return result;
}

function doc(tag, className, attr = 'size') {
    return { [tag]: { name: tag, class: className, description: `${tag} component`, attributes: {
        [attr]: { name: attr, description: `${attr} attribute`, values: [{ name: 'large', description: 'Large' }] },
    } } };
}

test('HTML definitions add and remove external component tags and attributes', () => {
    const html = service();
    html.addExternalDefinition('file:///external', doc('demo-card', 'Card'));
    assert.equal(html.getClassByTag('demo-card'), 'Card');
    assert.ok(html.provideTags().some(tag => tag.name === 'demo-card'));
    assert.ok(html.provideAttributes('demo-card').some(attr => attr.name === 'size'));
    assert.deepEqual(html.provideValues('demo-card', 'size'), [{ name: 'large', description: 'Large' }]);
    html.removeExternalDefinition('file:///external');
    assert.equal(html.getClassByTag('demo-card'), null);
    assert.ok(!html.provideTags().some(tag => tag.name === 'demo-card'));
});

test('HTML internal definitions override external entries then restore them on removal', () => {
    const html = service();
    const internalFile = { uri: 'file:///internal.wcl.avt' };
    html.addExternalDefinition('file:///external', doc('demo-card', 'ExternalCard', 'external'));
    html.addInternalDefinition(internalFile.uri, doc('demo-card', 'InternalCard', 'internal'), internalFile);
    assert.equal(html.getClassByTag('demo-card'), 'InternalCard');
    assert.equal(html.getInternalDefinition('demo-card'), internalFile);
    assert.ok(html.provideAttributes('demo-card').some(attr => attr.name === 'internal'));
    html.removeInternalDefinition(internalFile.uri);
    assert.equal(html.getClassByTag('demo-card'), 'ExternalCard');
    assert.equal(html.getInternalDefinition('demo-card'), undefined);
    assert.ok(html.provideAttributes('demo-card').some(attr => attr.name === 'external'));
});

test('HTML definition rebuild can be deferred while several files change', () => {
    const html = service();
    html.allowRebuildDefinition(false);
    html.addExternalDefinition('file:///external', doc('demo-card', 'Card'));
    assert.equal(html.getClassByTag('demo-card'), null);
    html.allowRebuildDefinition(true);
    assert.equal(html.getClassByTag('demo-card'), 'Card');
});

test('HTML style link resolves the SCSS source range and ignores unrelated positions', () => {
    const html = service();
    const view = TextDocument.create('file:///view.html.avt', 'aventus-html', 1, '<div class="card"></div>');
    const scss = TextDocument.create('file:///style.scss.avt', 'scss', 1, '.card { color: red; }');
    const file = {
        file: { documentUser: view },
        scssFile: { file: { uri: scss.uri, documentUser: scss } },
        fileParsed: { styleLinks: [[{ start: 12, end: 16 }, { start: 1, end: 5 }]] },
    };
    const links = html.getLinkToStyle(file, view.positionAt(13));
    assert.equal(links.length, 1);
    assert.equal(links[0].uri, scss.uri);
    assert.equal(scss.getText(links[0].range), 'card');
    assert.deepEqual(html.getLinkToStyle(file, view.positionAt(5)), []);
});

test('HTML internal tag URIs can be looked up and removed by source', () => {
    const html = service();
    html.addInternalTagUri('demo-card', 'file:///card.wcl.avt', 'Demo.Card');
    html.addInternalTagUri('demo-icon', 'file:///icon.wcl.avt', 'Demo.Icon');
    assert.deepEqual(html.getInternalTagUri('demo-card'), { uri: 'file:///card.wcl.avt', fullname: 'Demo.Card' });
    html.removeInternalTagUri('file:///card.wcl.avt');
    assert.equal(html.getInternalTagUri('demo-card'), undefined);
    assert.equal(html.getInternalTagUri('demo-icon').fullname, 'Demo.Icon');
});

test('removing a source currently leaves its second internal tag registered', () => {
    const html = service();
    const uri = 'file:///multi.wcl.avt';
    html.addInternalTagUri('demo-card', uri, 'Demo.Card');
    html.addInternalTagUri('demo-icon', uri, 'Demo.Icon');
    html.addInternalTagUri('other-tag', 'file:///other.wcl.avt', 'Other.Tag');

    html.removeInternalTagUri(uri);
    assert.equal(html.getInternalTagUri('demo-card'), undefined);
    assert.deepEqual(html.getInternalTagUri('demo-icon'), { uri, fullname: 'Demo.Icon' });
    assert.equal(html.getInternalTagUri('other-tag').fullname, 'Other.Tag');
});

test('HTML service formats nested markup into applicable text edits', async () => {
    const html = service();
    const document = TextDocument.create('file:///format.html.avt', 'Aventus HTML', 1, '<div>\n<span>Hello</span>\n</div>');
    const edits = await html.format(document, null, { tabSize: 2, insertSpaces: true });
    const formatted = TextDocument.applyEdits(document, edits);
    assert.match(formatted, /\n\s+<span>Hello<\/span>/);
    assert.match(formatted, /<\/div>/);
});

test('HTML service completion includes a registered component tag', async () => {
    const html = service();
    html.addExternalDefinition('file:///external', doc('demo-card', 'Card'));
    const document = TextDocument.create('file:///complete.html.avt', 'Aventus HTML', 1, '<demo-');
    const result = await html.doComplete({ file: { documentUser: document }, fileParsed: null }, document.positionAt(document.getText().length));
    assert.ok(result.items.some(item => item.label === 'demo-card'));
});
