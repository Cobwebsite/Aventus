import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { AventusHTMLLanguageService }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/html/LanguageService.ts',
]);

function service() {
    const html = Object.create(AventusHTMLLanguageService.prototype);
    html.extenalDocumentation = {};
    html.internalDocumentation = {};
    html.internalDocumentationReverse = {};
    html.internalTagUri = {};
    html._allowRebuildDefinition = true;
    html.rebuildDefinition();
    html.languageService = getLanguageService({ customDataProviders: [html.defaultProvider()] });
    return html;
}

function documentation(entries) {
    return Object.fromEntries(entries.map(([tag, cls, attr]) => [tag, {
        name: tag, class: cls, description: `${cls} component`,
        attributes: { [attr]: { name: attr, description: `${attr} option`, values: [] } },
    }]));
}

async function tagCompletions(html) {
    const document = TextDocument.create('file:///reload.html.avt', 'Aventus HTML', 1, '<');
    const result = await html.doComplete({ file: { documentUser: document }, fileParsed: null }, document.positionAt(1));
    return new Set(result.items.map(item => item.label));
}

test('HTML definitions switch multiple external sources after a batched project reload', async () => {
    const html = service();
    html.addExternalDefinition('file:///project-one', documentation([
        ['first-card', 'First', 'first'], ['shared-card', 'OneShared', 'from-one'],
    ]));
    html.addExternalDefinition('file:///project-two', documentation([
        ['second-card', 'Second', 'second'], ['shared-card', 'TwoShared', 'from-two'],
    ]));
    assert.equal(html.getClassByTag('shared-card'), 'TwoShared');
    assert.equal(html.getClassByTag('first-card'), 'First');

    html.allowRebuildDefinition(false);
    html.removeExternalDefinition('file:///project-two');
    html.removeExternalDefinition('file:///project-one');
    html.addExternalDefinition('file:///project-two', documentation([
        ['replacement-card', 'Replacement', 'replacement'],
    ]));
    html.allowRebuildDefinition(true);

    assert.equal(html.getClassByTag('first-card'), null);
    assert.equal(html.getClassByTag('second-card'), null);
    assert.equal(html.getClassByTag('shared-card'), null);
    assert.equal(html.getClassByTag('replacement-card'), 'Replacement');
    const completions = await tagCompletions(html);
    assert.ok(completions.has('replacement-card'));
    assert.ok(!completions.has('first-card'));
    assert.ok(!completions.has('second-card'));
    assert.ok(!completions.has('shared-card'));
    assert.deepEqual(await html.doValidation({}), []);
});

test('HTML internal source replacement restores external tag metadata and updates completion', async () => {
    const html = service();
    const internalUri = 'file:///components.wcl.avt';
    const internalFile = { uri: internalUri };
    html.addExternalDefinition('file:///package', documentation([
        ['shared-card', 'ExternalShared', 'package-attr'],
        ['package-only', 'PackageOnly', 'package-only-attr'],
    ]));
    html.addInternalDefinition(internalUri, documentation([
        ['shared-card', 'InternalShared', 'local-attr'],
        ['local-only', 'LocalOnly', 'local-only-attr'],
    ]), internalFile);
    assert.equal(html.getInternalDefinition('shared-card'), internalFile);
    assert.ok(html.provideAttributes('shared-card').some(attr => attr.name === 'local-attr'));

    html.removeInternalDefinition(internalUri);
    html.addInternalDefinition(internalUri, documentation([
        ['new-local', 'NewLocal', 'new-local-attr'],
    ]), internalFile);

    assert.equal(html.getClassByTag('shared-card'), 'ExternalShared');
    assert.equal(html.getInternalDefinition('shared-card'), undefined);
    assert.equal(html.getClassByTag('local-only'), null);
    assert.equal(html.getInternalDefinition('new-local'), internalFile);
    assert.deepEqual(html.provideAttributes('shared-card').filter(attr => attr.name === 'package-attr').length, 1);
    const completions = await tagCompletions(html);
    assert.ok(completions.has('shared-card'));
    assert.ok(completions.has('package-only'));
    assert.ok(completions.has('new-local'));
    assert.ok(!completions.has('local-only'));
    assert.deepEqual(await html.doValidation({}), []);
});
