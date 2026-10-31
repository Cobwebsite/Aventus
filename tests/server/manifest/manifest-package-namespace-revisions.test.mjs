import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown follows parsed exports moved between namespaces across revisions', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };

    const uri = 'file:///project/widgets.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'widgets', file: { uri }, build,
        srcInfo: { available: [] }, fileParsed: null,
    };
    const render = (version, namespace) => {
        const source = `namespace ${namespace} {
            /** Card in ${namespace}. */ export class Card { public title: string = ''; }
            /** Maker in ${namespace}. */ export function make(): number { return 1; }
        }`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        assert.ok(file.fileParsed.classes.Card);
        file.srcInfo.available = [
            { type: 1, fullName: 'Card' },
            { type: 4, fullName: 'make' },
        ];
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, 'OldWidgets');
    assert.match(first, /\[OldWidgets\.Card\]\(#pkg-oldwidgets-card\)/);
    assert.match(first, /\[OldWidgets\.make\]\(#pkg-oldwidgets-make\)/);
    assert.match(first, /Card in OldWidgets/);
    assert.match(first, /Maker in OldWidgets/);

    const second = render(2, 'NewWidgets');
    assert.match(second, /\[NewWidgets\.Card\]\(#pkg-newwidgets-card\)/);
    assert.match(second, /\[NewWidgets\.make\]\(#pkg-newwidgets-make\)/);
    assert.match(second, /Card in NewWidgets/);
    assert.match(second, /Maker in NewWidgets/);
    assert.doesNotMatch(second, /OldWidgets|pkg-oldwidgets/);
});
