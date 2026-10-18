import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown reorders parsed mixed exports after source and export-list revisions', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/order.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'order', file: { uri }, build, srcInfo: { available: [] }, fileParsed: null,
    };
    const render = (version, source, available) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        file.srcInfo.available = available;
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, `
        /** Last class. */ export class Zulu {}
        /** First value. */ export const Alpha: number = 1;
        /** Middle function. */ export function Middle(): boolean { return true; }
    `, [
        { type: 1, fullName: 'Zulu' }, { type: 4, fullName: 'Middle' },
        { type: 5, fullName: 'Alpha' },
    ]);
    assert.ok(first.indexOf('| [Alpha](#pkg-alpha)') < first.indexOf('| [Middle](#pkg-middle)'));
    assert.ok(first.indexOf('| [Middle](#pkg-middle)') < first.indexOf('| [Zulu](#pkg-zulu)'));
    assert.ok(first.indexOf('## Alpha') < first.indexOf('## Middle()'));
    assert.ok(first.indexOf('## Middle()') < first.indexOf('## Zulu'));
    assert.match(first, /## Alpha[\s\S]*Initial value : 1/);
    assert.match(first, /## Middle\(\)[\s\S]*Return : boolean/);

    const second = render(2, `
        /** New first class. */ export class Aaron {}
        /** Revised value. */ export const Alpha: string = 'new';
        /** Revised function. */ export function Middle(value: string): string { return value; }
    `, [
        { type: 4, fullName: 'Middle' }, { type: 5, fullName: 'Alpha' },
        { type: 1, fullName: 'Aaron' },
    ]);
    assert.ok(second.indexOf('| [Aaron](#pkg-aaron)') < second.indexOf('| [Alpha](#pkg-alpha)'));
    assert.ok(second.indexOf('| [Alpha](#pkg-alpha)') < second.indexOf('| [Middle](#pkg-middle)'));
    assert.ok(second.indexOf('## Aaron') < second.indexOf('## Alpha'));
    assert.ok(second.indexOf('## Alpha') < second.indexOf('## Middle(value: string)'));
    assert.match(second, /## Alpha[\s\S]*Initial value : 'new'/);
    assert.match(second, /## Middle\(value: string\)[\s\S]*Return : string/);
    assert.doesNotMatch(second, /Zulu|Last class|First value|Middle function|Return : boolean/);
});
