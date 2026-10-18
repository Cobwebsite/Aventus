import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown escapes table separators and flattens documentation lines after edits', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/markdown-cells.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'markdown-cells', file: { uri }, build,
        srcInfo: { available: [{ type: 2, fullName: 'Panel' }] }, fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        assert.ok(file.fileParsed.classes.Panel);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, `
        /** Panel summary. */ export class Panel {
            /** first | second\n             * continued line */ value: string | number;
            /** old | method\n             * details */ read(input: string | number): string | null { return null; }
        }
    `);
    assert.match(first, /\| value \| string &vert; number \| first \\\| second continued line \|/);
    assert.match(first, /\| read\(input: string &vert; number\) \| string &vert; null \| old \\\| method details \|/);

    const second = render(2, `
        /** Panel summary. */ export class Panel {
            /** revised | property\n             * next line */ value: boolean;
            /** new | method\n             * revised line */ read(input: boolean): boolean { return input; }
        }
    `);
    assert.match(second, /\| value \| boolean \| revised \\\| property next line \|/);
    assert.match(second, /\| read\(input: boolean\) \| boolean \| new \\\| method revised line \|/);
    assert.doesNotMatch(second, /first \\\| second|old \\\| method|string &vert; number|string &vert; null/);
});
