import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('les décorateurs de propriété recalculent visibilité, dépréciation et exigence de type après édition', () => {
    const uri = 'file:///D:/round157/property-decorators.lib.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const parse = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        return ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
    };
    const typeError = model => model.errors.some(error => error.message.includes('must define a type for the prop title'));

    const initial = parse(1, 'export class Card { public title = "x"; }');
    assert.equal(typeError(initial), true);
    assert.equal(initial.classes.Card.properties.title.isPrivate, false);
    assert.equal(initial.classes.Card.properties.title.deprecated, false);

    const decorated = parse(2, 'export class Card { @NoType() @Internal() @Deprecated("Use name") public title = "x"; }');
    const property = decorated.classes.Card.properties.title;
    assert.equal(typeError(decorated), false);
    assert.equal(property.isPrivate, true);
    assert.equal(property.deprecated, true);
    assert.equal(property.deprecatedMsg, 'Use name');
    assert.match(property.compiledContent, /private title/);
    assert.doesNotMatch(property.compiledContent, /@NoType|@Internal|@Deprecated/);

    const removed = parse(3, 'export class Card { public title: string = "x"; }');
    assert.equal(typeError(removed), false);
    assert.equal(removed.classes.Card.properties.title.isPrivate, false);
    assert.equal(removed.classes.Card.properties.title.deprecated, false);
    assert.match(removed.classes.Card.properties.title.compiledContent, /public title/);
});
