import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsFileSelector }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

function file(uri) {
    const document = TextDocument.create(uri, 'typescript', 1, '');
    const result = { uri, versionInternal: 1, documentUser: document, documentInternal: document };
    for (const name of [
        'CanContentChange', 'ContentChange', 'Validate', 'Save', 'Delete', 'Completion',
        'CompletionResolve', 'Hover', 'Definition', 'Formatting', 'CodeAction',
        'References', 'CodeLens', 'GetBuild', 'Rename',
    ]) result[`on${name}`] = () => name;
    return result;
}

function build() {
    return {
        getNamespace: () => '',
        getComponentPrefix: () => 'demo',
        tsLanguageService: { addFile() {} },
        npmBuilder: { unregister() {} },
        buildConfig: {},
        hasNpmOutput: false,
    };
}

test('TypeScript file selector maps the supported file families', () => {
    const expected = new Map([
        ['wcl', 'AventusWebComponentLogicalFile'],
        ['data', 'AventusDataFile'],
        ['lib', 'AventusLibFile'],
        ['ram', 'AventusRamFile'],
        ['state', 'AventusStateFile'],
        ['static', 'AventusStaticFile'],
        ['def', 'AventusDefinitionFile'],
    ]);
    for (const [extension, className] of expected) {
        const selected = AventusTsFileSelector(file(`file:///D:/app/empty.${extension}.avt`), build());
        assert.ok(selected?.constructor.name.endsWith(className), extension);
    }
    assert.equal(AventusTsFileSelector(file('file:///D:/app/empty.unknown.avt'), build()), null);
});
