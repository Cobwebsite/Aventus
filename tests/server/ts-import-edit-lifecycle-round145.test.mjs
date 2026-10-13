import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('les imports npm suivent les éditions du même fichier sans conserver les anciens alias', () => {
    const uri = 'file:///D:/test/import-edit-lifecycle-round145.lib.avt';
    const active = new Map();
    const events = [];
    const build = {
        npmBuilder: {
            unregister(sourceUri) { events.push(['unregister', sourceUri]); active.delete(sourceUri); },
            register(sourceUri, dependency) {
                events.push(['register', dependency.uri, dependency.libName, dependency.alias]);
                const registrations = active.get(sourceUri) ?? [];
                registrations.push(dependency);
                active.set(sourceUri, registrations);
                return [];
            },
        },
        project: { resolveAlias: name => name },
        buildConfig: {}, hasNpmOutput: true,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    function parse(version, content) {
        const document = TextDocument.create(uri, 'typescript', version, content);
        return ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
    }

    const first = parse(1, 'import { Alpha as LocalAlpha } from "first-pkg";');
    assert.deepEqual(first.npmImports, { LocalAlpha: { uri: 'first-pkg', nameInsideLib: 'Alpha' } });
    assert.deepEqual(active.get(uri).map(item => item.alias), ['LocalAlpha']);

    const second = parse(2, 'import type { Alpha } from "first-pkg";\nimport * as Widgets from "second-pkg";');
    assert.notEqual(second, first);
    assert.deepEqual(second.npmImports, { Widgets: { uri: 'second-pkg', nameInsideLib: '*' } });
    assert.deepEqual(active.get(uri).map(item => item.alias), ['Widgets']);

    const third = parse(3, 'export class NoImports {}');
    assert.deepEqual(third.npmImports, {});
    assert.equal(active.has(uri), false);
    assert.deepEqual(events, [
        ['unregister', uri], ['register', 'first-pkg', 'Alpha', 'LocalAlpha'],
        ['unregister', uri], ['register', 'second-pkg', '*', 'Widgets'],
        ['unregister', uri],
    ]);
});
