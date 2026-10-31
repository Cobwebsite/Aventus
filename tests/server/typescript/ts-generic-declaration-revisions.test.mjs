import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

test('generic compilation replaces declarations after namespace, kind and export revisions', t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-generic-revisions-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'sample.lib.avt');
    const uri = pathToFileURL(path).href;
    const namespaces = [];
    const build = {
        module: 'Demo', namespaces: [], isCoreBuild: false, hasNpmOutput: false,
        npmBuilder: { unregister() {} }, buildConfig: {},
        addNamespace(namespace) { namespaces.push(namespace); },
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const file = { uri, path, versionInternal: 1 };
    const unit = { file, build, fileParsed: null };
    const compile = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.versionInternal = version;
        file.documentUser = document;
        file.documentInternal = document;
        unit.fileParsed = ParserTs.parse(file, false, build);
        namespaces.length = 0;
        return genericTsCompile(unit);
    };

    const first = compile(1, 'namespace Alpha { export class OldCard { value = 1; } export function oldFactory() { return 1; } }');
    assert.deepEqual(first.map(entry => entry.type), [1, 4]);
    assert.deepEqual(namespaces, ['Alpha', 'Alpha']);
    assert.match(first.map(entry => entry.compiled).join('\n'), /OldCard/);
    assert.match(first.map(entry => entry.compiled).join('\n'), /oldFactory/);

    const second = compile(2, 'namespace Beta { export enum NewMode { Ready = 2 } export const current = NewMode.Ready; }');
    assert.deepEqual(second.map(entry => entry.type), [6, 5]);
    assert.deepEqual(namespaces, ['Beta', 'Beta']);
    const output = second.map(entry => entry.compiled).join('\n');
    assert.match(output, /NewMode/);
    assert.match(output, /current/);
    assert.doesNotMatch(output, /OldCard|oldFactory|Alpha/);
    assert.ok(second.every(entry => entry.uri === uri));

    const third = compile(3, 'export type OnlyType = string;');
    assert.deepEqual(third.map(entry => entry.type), [0]);
    assert.doesNotMatch(third[0].compiled, /NewMode|current|Beta/);
});
