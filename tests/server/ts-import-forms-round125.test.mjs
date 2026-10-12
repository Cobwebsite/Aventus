import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

let sequence = 0;
function parse(source) {
    const uri = `file:///D:/test/import-forms-round125-${++sequence}.lib.avt`;
    const document = TextDocument.create(uri, 'typescript', 1, source);
    const registered = [];
    const unregistered = [];
    const build = {
        npmBuilder: {
            unregister(value) { unregistered.push(value); },
            register(value, dependency) { registered.push({ sourceUri: value, ...dependency }); },
        },
        project: { resolveAlias: name => name },
        buildConfig: {}, hasNpmOutput: true,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    return { uri, model: ParserTs.parse({ uri, versionInternal: 1, documentUser: document, documentInternal: document }, false, build), registered, unregistered };
}

test('les imports npm nommés et renommés gardent leur nom de bibliothèque et omettent les imports de type', () => {
    const { uri, model, registered, unregistered } = parse('import { Alpha, Beta as LocalBeta, type TypeOnly } from "sample-pkg";\nimport type { Schema } from "types-pkg";');
    assert.deepEqual(unregistered, [uri]);
    assert.deepEqual(registered, [
        { sourceUri: uri, uri: 'sample-pkg', libName: 'Alpha', alias: 'Alpha' },
        { sourceUri: uri, uri: 'sample-pkg', libName: 'Beta', alias: 'LocalBeta' },
    ]);
    assert.deepEqual(model.npmImports, {
        Alpha: { uri: 'sample-pkg', nameInsideLib: 'Alpha' },
        LocalBeta: { uri: 'sample-pkg', nameInsideLib: 'Beta' },
    });
    assert.deepEqual(model.errors, []);
});

test('un import npm par défaut conserve le nom local dans le builder et le modèle', () => {
    const { uri, model, registered, unregistered } = parse('import Client from "sample-pkg";');
    assert.deepEqual(unregistered, [uri]);
    assert.equal(registered.length, 1);
    assert.equal(registered[0].sourceUri, uri);
    assert.equal(registered[0].uri, 'sample-pkg');
    assert.equal(registered[0].libName, 'default');
    assert.equal(registered[0].alias, 'Client');
    assert.deepEqual(model.npmImports.Client, { uri: 'sample-pkg', nameInsideLib: 'default' });
    assert.deepEqual(model.errors, []);
});

test('les imports namespace npm conservent leur alias et les imports de type restent absents du builder', () => {
    const { uri, model, registered } = parse('import * as Widgets from "widget-pkg";\nimport type * as Types from "type-pkg";');
    assert.deepEqual(registered, [{ sourceUri: uri, uri: 'widget-pkg', libName: '*', alias: 'Widgets' }]);
    assert.deepEqual(model.npmImports, { Widgets: { uri: 'widget-pkg', nameInsideLib: '*' } });
    assert.deepEqual(model.errors, []);
});

test('un import npm combinant défaut et noms enregistre les deux parties', () => {
    const { uri, model, registered } = parse('import Client, { Helper as LocalHelper, type Schema } from "sample-pkg";');
    assert.deepEqual(registered, [
        { sourceUri: uri, uri: 'sample-pkg', libName: 'default', alias: 'Client' },
        { sourceUri: uri, uri: 'sample-pkg', libName: 'Helper', alias: 'LocalHelper' },
    ]);
    assert.deepEqual(model.npmImports, {
        Client: { uri: 'sample-pkg', nameInsideLib: 'default' },
        LocalHelper: { uri: 'sample-pkg', nameInsideLib: 'Helper' },
    });
    assert.deepEqual(model.errors, []);
});

test('un import npm combinant défaut et namespace enregistre les deux parties', () => {
    const { uri, model, registered } = parse('import Client, * as Widgets from "sample-pkg";');
    assert.deepEqual(registered, [
        { sourceUri: uri, uri: 'sample-pkg', libName: 'default', alias: 'Client' },
        { sourceUri: uri, uri: 'sample-pkg', libName: '*', alias: 'Widgets' },
    ]);
    assert.deepEqual(model.npmImports, {
        Client: { uri: 'sample-pkg', nameInsideLib: 'default' },
        Widgets: { uri: 'sample-pkg', nameInsideLib: '*' },
    });
    assert.deepEqual(model.errors, []);
});
