import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('InternalProtected et Internal recalculent la visibilité des propriétés et méthodes après trois éditions', () => {
    const uri = 'file:///D:/round192/internal-protected.lib.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const parse = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        return ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
    };
    const members = model => [model.classes.Card.properties.count, model.classes.Card.methods.increment];

    const protectedSource = 'export class Card {\n  @InternalProtected() public count: number = 0;\n  @InternalProtected() public increment(): void {}\n}';
    const first = parse(1, protectedSource);
    for (const member of members(first)) {
        assert.equal(member.isProtected, true);
        assert.equal(member.isPrivate, false);
        assert.match(member.compiledContent, /protected/);
        assert.doesNotMatch(member.compiledContent, /@InternalProtected/);
    }

    const privateSource = '\n\n' + protectedSource.replaceAll('InternalProtected', 'Internal');
    const second = parse(2, privateSource);
    for (const member of members(second)) {
        assert.equal(member.isPrivate, true);
        assert.equal(member.isProtected, false);
        assert.match(member.compiledContent, /private/);
        assert.doesNotMatch(member.compiledContent, /@Internal/);
    }

    const publicSource = privateSource.replaceAll('@Internal() ', '');
    const third = parse(3, publicSource);
    for (const member of members(third)) {
        assert.equal(member.isPrivate, false);
        assert.equal(member.isProtected, false);
        assert.match(member.compiledContent, /public/);
    }
    assert.equal(third.errors.some(error => /InternalProtected|Internal/.test(error.message)), false);
});
