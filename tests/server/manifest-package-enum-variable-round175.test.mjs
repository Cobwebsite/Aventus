import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown renews parsed enum members and variable initial values after source edit', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/status.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'status', file: { uri }, build,
        srcInfo: { available: [
            { type: 6, fullName: 'Status' }, { type: 5, fullName: 'DEFAULT_STATUS' },
        ] },
        fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse(
            { uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build,
        );
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, `
        /** Lifecycle states. */ export enum Status {
            /** Waiting for work. */ Pending = 'pending',
            /** Work finished. */ Done = 'done',
        }
        /** Initial state. */ export const DEFAULT_STATUS: string = 'pending';
    `);
    assert.match(first, /Lifecycle states/);
    assert.match(first, /\| Pending \| 'pending' \| Waiting for work/);
    assert.match(first, /\| Done \| 'done' \| Work finished/);
    assert.match(first, /Initial state/);
    assert.match(first, /Initial value : 'pending'/);

    const second = render(2, `
        /** New lifecycle. */ export enum Status {
            /** Could not proceed. */ Failed = 'failed',
        }
        /** Fallback state. */ export const DEFAULT_STATUS: string = 'failed';
    `);
    assert.match(second, /New lifecycle/);
    assert.match(second, /\| Failed \| 'failed' \| Could not proceed/);
    assert.match(second, /Fallback state/);
    assert.match(second, /Initial value : 'failed'/);
    assert.doesNotMatch(second, /Lifecycle states|Waiting for work|Work finished|\| Pending \||\| Done \||Initial value : 'pending'/);
});
