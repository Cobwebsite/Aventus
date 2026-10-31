import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { genericTsCompile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'language-services/ts/compiler.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };

function withParsedFile(source, run) {
    const dir = mkdtempSync(join(process.cwd(), 'aventus-ts-compile-round113-'));
    try {
        const path = join(dir, 'sample.lib.avt');
        const uri = pathToFileURL(path).href;
        const document = TextDocument.create(uri, 'typescript', 1, source);
        const namespaces = [];
        const build = {
            module: 'Demo', namespaces: [], isCoreBuild: false, hasNpmOutput: false,
            npmBuilder: { unregister() {} }, buildConfig: {},
            addNamespace(namespace) { namespaces.push(namespace); },
            getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        };
        const file = { uri, path, versionInternal: 1, documentUser: document, documentInternal: document };
        const fileParsed = ParserTs.parse(file, false, build);
        return run({ file: { file, fileParsed, build }, namespaces, dir });
    }
    finally { rmSync(dir, { recursive: true, force: true }); }
}

test('generic TS compilation includes runtime declarations and tracks their namespaces', () => withParsedFile(
    'namespace App { export class Card { value = 1; } export enum Mode { Ready } export type Id = string; export function make() { return new Card(); } export const enabled = true; }',
    ({ file, namespaces }) => {
        const results = genericTsCompile(file);
        assert.deepEqual(results.map(result => result.type), [1, 6, 0, 4, 5]);
        assert.ok(results.some(result => result.compiled.includes('Card')));
        assert.ok(results.some(result => result.compiled.includes('Mode')));
        assert.ok(results.some(result => result.compiled.includes('make')));
        assert.ok(results.some(result => result.compiled.includes('enabled')));
        assert.ok(results.every(result => result.uri === file.file.uri));
        assert.deepEqual(namespaces, Array(results.length).fill('App'));
    },
));

test('generic TS compilation removes a stale debugger output after a source edit', () => withParsedFile(
    'export class Traced { value = 1; }',
    ({ file, dir }) => {
        const debugPath = join(dir, 'sample.lib.js');
        const compiled = genericTsCompile(file);
        assert.equal(compiled[0].debugTxt, '');
        writeFileSync(debugPath, 'stale debugger output');

        const source = 'export class Traced { value = 2; }';
        const document = TextDocument.create(file.file.uri, 'typescript', 2, source);
        file.file.versionInternal = 2;
        file.file.documentUser = document;
        file.file.documentInternal = document;
        file.fileParsed = ParserTs.parse(file.file, false, file.build);
        assert.equal(genericTsCompile(file)[0].debugTxt, '');
        assert.equal(existsSync(debugPath), false);
    },
));
