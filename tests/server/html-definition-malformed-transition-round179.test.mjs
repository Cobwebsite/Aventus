import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserHtml }, { AventusHTMLLanguageService }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/LanguageService.ts',
]);

test('HTML component definitions track local, external and removed states across malformed edits', async () => {
    const html = Object.create(AventusHTMLLanguageService.prototype);
    html.extenalDocumentation = {};
    html.internalDocumentation = {};
    html.internalDefinitionFiles = {};
    html.internalDocumentationReverse = {};
    html.internalTagUri = {};
    html._allowRebuildDefinition = true;
    html.rebuildDefinition();
    html.languageService = getLanguageService({ customDataProviders: [html.defaultProvider()] });

    const uri = 'file:///D:/round179/component.html.avt';
    const localUri = 'file:///D:/round179/component.wcl.avt';
    const localFile = { uri: localUri };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: html };
    const view = { file: { uri, versionUser: 0 }, build, tsFile: null, scssFile: null, fileParsed: null };
    const doc = (name, attribute) => ({ 'shared-card': {
        name: 'shared-card', class: name, description: name,
        attributes: { [attribute]: { name: attribute, description: attribute, values: [] } },
    } });
    html.addExternalDefinition('file:///package', doc('PackageCard', 'package-flag'));
    html.addInternalDefinition(localUri, doc('LocalCard', 'local-flag'), localFile);

    async function inspect(source) {
        view.file.versionUser++;
        view.file.documentUser = TextDocument.create(uri, 'Aventus HTML', view.file.versionUser, source);
        view.fileParsed = ParserHtml.parse(view, build);
        const position = view.file.documentUser.positionAt(source.indexOf('<shared-card ') + '<shared-card '.length);
        const completion = await html.doComplete(view, position);
        return { errors: view.fileParsed.errors, labels: new Set(completion.items.map(item => item.label)) };
    }

    const local = await inspect('<shared-card ></shared-card>');
    assert.deepEqual(local.errors, []);
    assert.equal(html.getInternalDefinition('shared-card'), localFile);
    assert.equal(html.getClassByTag('shared-card'), 'LocalCard');
    assert.ok(local.labels.has('local-flag'));
    assert.ok(!local.labels.has('package-flag'));

    html.removeInternalDefinition(localUri);
    const external = await inspect('<div><shared-card ></div>');
    assert.ok(external.errors.length > 0);
    assert.equal(html.getInternalDefinition('shared-card'), undefined);
    assert.equal(html.getClassByTag('shared-card'), 'PackageCard');
    assert.ok(external.labels.has('package-flag'));
    assert.ok(!external.labels.has('local-flag'));

    html.removeExternalDefinition('file:///package');
    const removed = await inspect('<shared-card ></shared-card>');
    assert.deepEqual(removed.errors, []);
    assert.equal(html.getInternalDefinition('shared-card'), undefined);
    assert.equal(html.getClassByTag('shared-card'), null);
    assert.ok(!removed.labels.has('local-flag'));
    assert.ok(!removed.labels.has('package-flag'));
});
