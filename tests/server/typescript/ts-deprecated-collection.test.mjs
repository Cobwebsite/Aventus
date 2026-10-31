import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

const uri = 'file:///D:/round220/deprecated.lib.avt';
const build = {
    npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
    getNamespaceForUri: () => '', getNpmReplacementName: () => '',
};

function parse(source, version) {
    const document = TextDocument.create(uri, 'typescript', version, source);
    const model = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
    return { model, document };
}

test('deprecated declarations are collected with exact name spans and refreshed after edits', () => {
    const first = parse([
        '@Deprecated("Use NewCard") export class Card {',
        '    @Deprecated() public old: string = "";',
        '    @Deprecated("Use next") public previous(): void {}',
        '}',
    ].join('\n'), 1);
    const entries = first.model.deprecated.map(item => ({
        name: first.document.getText().slice(item.start, item.end),
        message: item.msg,
    }));
    assert.deepEqual(entries, [
        { name: 'Card', message: 'Use NewCard' },
        { name: 'previous', message: 'Use next' },
        { name: 'old', message: 'This code is deprecated' },
    ]);

    const second = parse('export class Card { public old: string = ""; public previous(): void {} }', 2);
    assert.deepEqual(second.model.deprecated, []);
    assert.equal(second.model.classes.Card.deprecated, false);
    assert.equal(second.model.classes.Card.properties.old.deprecated, false);
    assert.equal(second.model.classes.Card.methods.previous.deprecated, false);
});
