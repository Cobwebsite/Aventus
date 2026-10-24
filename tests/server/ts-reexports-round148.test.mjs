import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('les réexports nommés et wildcard produisent un diagnostic qui suit les éditions', () => {
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
    assert.equal(first.errors.length, 2);
    assert.ok(first.errors.every(error => /Re-exports from another file are not supported/.test(error.message)));
    assert.deepEqual(first.internalObjects, {});
    assert.deepEqual(first.importsLocal, {});
    assert.equal(first.getBaseInfo('PublicCard'), null);

    const edited = parse(2, 'export { NewCard as PublicCard } from "./NewCard";');
    assert.notEqual(edited, first);
    assert.equal(edited.errors.length, 1);
    assert.match(edited.errors[0].message, /Re-exports from another file are not supported/);
    assert.deepEqual(edited.internalObjects, {});
    assert.deepEqual(edited.importsLocal, {});
    assert.equal(edited.getBaseInfo('PublicCard'), null);

    const declared = parse(3, 'export class PublicCard {}');
    assert.deepEqual(declared.errors, []);
    assert.equal(declared.internalObjects.PublicCard.isExported, true);
    assert.equal(declared.getBaseInfo('PublicCard'), declared.classes.PublicCard);
});
