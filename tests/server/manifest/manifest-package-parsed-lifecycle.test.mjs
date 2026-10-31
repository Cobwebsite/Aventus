import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown follows parsed class, function, enum and variable changes without stale declarations', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/widgets.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const parsed = (version, content) => {
        const document = TextDocument.create(uri, 'typescript', version, content);
        return ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
    };
    const file = {
        name: 'widgets', file: { uri }, build,
        srcInfo: { available: [
            { type: 1, fullName: 'Card' },
            { type: 4, fullName: 'make' },
            { type: 6, fullName: 'Mode' },
            { type: 5, fullName: 'VERSION' },
        ] },
        fileParsed: parsed(1, `
            /** Card description. */ export class Card { title: string; }
            /** Factory description. */ export function make(value: string): string { return value; }
            export enum Mode { Ready }
            export const VERSION = 1;
        `),
    };
    const first = new ManifestPackageMd(file).getContent();
    assert.match(first, /Card description/);
    assert.match(first, /Factory description/);
    assert.match(first, /Mode/);
    assert.match(first, /## VERSION/);

    file.srcInfo.available = [
        { type: 1, fullName: 'Panel' }, { type: 4, fullName: 'create' },
        { type: 5, fullName: 'REVISION' },
    ];
    file.fileParsed = parsed(2, `
        /** Panel description. */ export class Panel { count: number; }
        export function create(value: number): number { return value; }
        export const REVISION = 2;
    `);
    const second = new ManifestPackageMd(file).getContent();
    assert.match(second, /Panel description/);
    assert.match(second, /create\(value: number\)/);
    assert.match(second, /## REVISION/);
    assert.doesNotMatch(second, /Card description|Factory description|\bMode\b|make\(value|\bVERSION\b/);
});
