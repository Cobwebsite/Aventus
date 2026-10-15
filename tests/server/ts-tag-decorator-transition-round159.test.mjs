import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('le renommage puis retrait du décorateur TagName renouvelle ses transformations de compilation', () => {
    const uri = 'file:///D:/round159/tag-decorator.lib.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const parse = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        return ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
    };

    const firstSource = '@TagName("x-first") export class Card {}';
    const first = parse(1, firstSource).classes.Card;
    assert.equal(first.decorators[0].arguments[0].value, 'x-first');
    assert.equal(firstSource.slice(first.decorators[0].start, first.decorators[0].end), '@TagName("x-first")');
    assert.doesNotMatch(first.compiledContent, /@TagName/);
    assert.equal(Object.keys(first.compileTransformations).length, 1);

    const secondSource = '\n@TagName("x-second") export class Card {}';
    const second = parse(2, secondSource).classes.Card;
    assert.equal(second.decorators[0].arguments[0].value, 'x-second');
    assert.equal(secondSource.slice(second.decorators[0].start, second.decorators[0].end), '@TagName("x-second")');
    assert.doesNotMatch(second.compiledContent, /@TagName|x-first/);
    assert.equal(Object.keys(second.compileTransformations).length, 1);

    const removed = parse(3, 'export class Card {}').classes.Card;
    assert.deepEqual(removed.decorators, []);
    assert.deepEqual(removed.compileTransformations, {});
    assert.doesNotMatch(removed.compiledContent, /TagName|x-first|x-second/);
});
