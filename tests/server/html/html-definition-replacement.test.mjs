import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { AventusHTMLLanguageService }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/html/LanguageService.ts',
]);

function service() {
    const html = Object.create(AventusHTMLLanguageService.prototype);
    html.extenalDocumentation = {};
    html.internalDocumentation = {};
    html.internalDefinitionFiles = {};
    html.internalDocumentationReverse = {};
    html.internalTagUri = {};
    html._allowRebuildDefinition = true;
    html.rebuildDefinition();
    html.languageService = getLanguageService({ customDataProviders: [html.defaultProvider()] });
    return html;
}

function doc(tag, cls, attr, value) {
    return { [tag]: { name: tag, class: cls, description: `${cls} description`, attributes: {
        [attr]: { name: attr, description: `${attr} description`, values: [{ name: value }] },
    } } };
}

async function completion(html, text) {
    const document = TextDocument.create('file:///definition-round71.html.avt', 'Aventus HTML', 1, text);
    return (await html.doComplete({ file: { documentUser: document }, fileParsed: null }, document.positionAt(text.length))).items.map(item => item.label);
}

test('replacing a package definition under the same URI updates tag, attribute and value completion', async () => {
    const html = service();
    const uri = 'file:///package-one';
    html.addExternalDefinition(uri, doc('demo-card', 'OldCard', 'size', 'large'));
    assert.ok((await completion(html, '<')).includes('demo-card'));
    assert.deepEqual(html.provideValues('demo-card', 'size'), [{ name: 'large' }]);

    html.addExternalDefinition(uri, doc('demo-tile', 'NewTile', 'tone', 'warm'));
    assert.equal(html.getClassByTag('demo-card'), null);
    assert.equal(html.getClassByTag('demo-tile'), 'NewTile');
    assert.deepEqual(html.provideValues('demo-tile', 'tone'), [{ name: 'warm' }]);
    assert.deepEqual(html.provideValues('demo-card', 'size'), []);
    const tags = await completion(html, '<');
    assert.ok(!tags.includes('demo-card'));
    assert.ok(tags.includes('demo-tile'));
    const attrs = await completion(html, '<demo-tile ');
    assert.ok(attrs.includes('tone'));
    assert.ok(!attrs.includes('size'));
});

test('removing the winning package definition restores the older package tag and its metadata', async () => {
    const html = service();
    html.addExternalDefinition('file:///first-package', doc('shared-card', 'FirstCard', 'first-attr', 'one'));
    html.addExternalDefinition('file:///second-package', doc('shared-card', 'SecondCard', 'second-attr', 'two'));
    assert.equal(html.getClassByTag('shared-card'), 'SecondCard');
    assert.deepEqual(html.provideValues('shared-card', 'second-attr'), [{ name: 'two' }]);
    html.removeExternalDefinition('file:///second-package');
    assert.equal(html.getClassByTag('shared-card'), 'FirstCard');
    assert.deepEqual(html.provideValues('shared-card', 'first-attr'), [{ name: 'one' }]);
    assert.deepEqual(html.provideValues('shared-card', 'second-attr'), []);
    const attrs = await completion(html, '<shared-card ');
    assert.ok(attrs.includes('first-attr'));
    assert.ok(!attrs.includes('second-attr'));
});

test('replacing an internal definition at the same URI removes its former reverse lookup', () => {
    const html = service();
    const uri = 'file:///local-component.wcl.avt';
    const file = { uri };
    html.addInternalDefinition(uri, doc('old-card', 'OldCard', 'old-attr', 'old'), file);
    html.addInternalDefinition(uri, doc('new-card', 'NewCard', 'new-attr', 'new'), file);
    assert.equal(html.getClassByTag('old-card'), null);
    assert.equal(html.getInternalDefinition('new-card'), file);
    assert.equal(html.internalDocumentationReverse.OldCard, undefined);
    html.removeInternalDefinition(uri);
    assert.equal(html.getInternalDefinition('new-card'), undefined);
    assert.equal(html.internalDocumentationReverse.OldCard, undefined);
});

test('removing an internal definition preserves a class supplied by another URI', () => {
    const html = service();
    const first = { uri: 'file:///first.wcl.avt' };
    const second = { uri: 'file:///second.wcl.avt' };
    html.addInternalDefinition(first.uri, doc('first-card', 'SharedCard', 'size', 'small'), first);
    html.addInternalDefinition(second.uri, doc('second-card', 'SharedCard', 'tone', 'warm'), second);
    assert.equal(html.internalDocumentationReverse.SharedCard, second);
    html.removeInternalDefinition(second.uri);
    assert.equal(html.internalDocumentationReverse.SharedCard, first);
});
