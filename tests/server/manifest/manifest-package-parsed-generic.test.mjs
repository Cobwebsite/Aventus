import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('parsed generic package documentation refreshes class, method and union signatures after edits', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/generics.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'generics', file: { uri }, build,
        srcInfo: { available: [{ type: 1, fullName: 'Repository' }] },
        fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, `/** Repository docs. */ export class Repository<T extends string = string> {
        /** Reads value. */ public read<U extends number = number>(key: T): T | U { throw 0; }
    }`);
    assert.match(first, /## Repository<T extends string = string>/);
    assert.match(first, /read<U extends number = number>\(key: T\)/);
    assert.match(first, /T &vert; U/);
    assert.match(first, /Reads value/);

    const second = render(2, `/** Current store. */ export class Repository<K extends number = number> {
        /** Looks up. */ public lookup<V extends boolean = boolean>(key: K): K | V { throw 0; }
    }`);
    assert.match(second, /## Repository<K extends number = number>/);
    assert.match(second, /lookup<V extends boolean = boolean>\(key: K\)/);
    assert.match(second, /K &vert; V/);
    assert.doesNotMatch(second, /Reads value|read<U|T &vert; U|Repository<T/);
});
