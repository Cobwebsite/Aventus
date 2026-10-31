import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'GenericServer.ts',
]);

test('parser cache invalidates when the same TextDocument object advances', t => {
    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 4 };
    t.after(() => { GenericServer.instance = previousServer; });

    for (const extension of ['lib', 'data']) {
        const uri = `file:///parser-revisions.${extension}.avt`;
        const document = TextDocument.create(uri, 'typescript', 1, 'export class First {}');
        const file = {
            uri,
            documentUser: document,
            documentInternal: document,
            get versionInternal() { return document.version; },
        };
        const build = {
            npmBuilder: { unregister() {} },
            buildConfig: {},
            hasNpmOutput: false,
            getNamespaceForUri: () => '',
            getNpmReplacementName: () => '',
        };

        const first = ParserTs.parse(file, false, build);
        assert.equal(ParserTs.parse(file, false, build), first);
        assert.ok(first.classes.First);

        TextDocument.update(document, [{ text: 'export class Second {}' }], 2);
        const second = ParserTs.parse(file, false, build);
        assert.notEqual(second, first);
        assert.ok(second.classes.Second);
        assert.equal(second.classes.First, undefined);

        TextDocument.update(document, [{ text: 'export class Third {}' }], 3);
        const third = ParserTs.parse(file, false, build);
        assert.notEqual(third, second);
        assert.ok(third.classes.Third);
        assert.equal(third.classes.Second, undefined);
        assert.equal(ParserTs.parse(file, false, build), third);
    }
});
