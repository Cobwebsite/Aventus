import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('les réexports nommés et wildcard restent absents du modèle, même après édition', () => {
    const uri = 'file:///D:/round148/barrel.lib.avt';
    const build = {
        npmBuilder: { unregister() {} }, project: { resolveAlias: value => value },
        buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    function parse(version, source) {
        const document = TextDocument.create(uri, 'typescript', version, source);
        return ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
    }

    const first = parse(1, 'export { Card as PublicCard } from "./Card";\nexport * from "./More";');
    assert.deepEqual(first.errors, []);
    assert.deepEqual(first.internalObjects, {});
    assert.deepEqual(first.importsLocal, {});
    assert.equal(first.getBaseInfo('PublicCard'), null);

    const edited = parse(2, 'export { NewCard as PublicCard } from "./NewCard";');
    assert.notEqual(edited, first);
    assert.deepEqual(edited.errors, []);
    assert.deepEqual(edited.internalObjects, {});
    assert.deepEqual(edited.importsLocal, {});
    assert.equal(edited.getBaseInfo('PublicCard'), null);

    const declared = parse(3, 'export class PublicCard {}');
    assert.equal(declared.internalObjects.PublicCard.isExported, true);
    assert.equal(declared.getBaseInfo('PublicCard'), declared.classes.PublicCard);
});
