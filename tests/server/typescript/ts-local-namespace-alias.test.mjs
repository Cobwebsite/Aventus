import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('export namespace is diagnosed while local namespace members remain valid', () => {
    const folder = `file:///d:/test/local-namespace-alias-round199-${process.pid}`;
    const sourceUri = `${folder.replace('d:', 'd%3A')}/source`;
    const ownerUri = `${folder}/owner.lib.avt`;
    const build = {
        npmBuilder: { unregister() {} }, project: { resolveAlias: name => name },
        buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const parse = (uri, version, content) => {
        const document = TextDocument.create(uri, 'typescript', version, content);
        return ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
    };

    const source1 = parse(sourceUri, 1, 'export namespace Widgets { export class Card {} }');
    assert.match(source1.errors.map(error => error.message).join('\n'), /namespaces cannot be exported/);
    assert.deepEqual(source1.errors[0].range.start, { line: 0, character: 0 });
    assert.deepEqual(source1.errors[0].range.end, { line: 0, character: 6 });
    const owner1 = parse(ownerUri, 1, 'import { Widgets as UI } from "./source";\nexport class Owner {}');
    assert.equal(owner1.importsLocal.UI.info, undefined);
    assert.match(owner1.errors.map(error => error.message).join('\n'), /Can't load .* Widgets /);

    const source2 = parse(sourceUri, 2, 'export namespace Controls { export class Card {} }');
    assert.match(source2.errors.map(error => error.message).join('\n'), /namespaces cannot be exported/);
    const owner2 = parse(ownerUri, 2, 'import { Widgets as UI } from "./source";\nexport class Owner {}');
    assert.equal(owner2.importsLocal.UI.info, undefined);
    assert.match(owner2.errors.map(error => error.message).join('\n'), /Can't load .* Widgets /);

    const owner3 = parse(ownerUri, 3, 'import { Controls as ControlsUI } from "./source";\nexport class Owner {}');
    assert.deepEqual(Object.keys(owner3.importsLocal), ['ControlsUI']);
    assert.equal(owner3.importsLocal.ControlsUI.info, undefined);
    assert.match(owner3.errors.map(error => error.message).join('\n'), /Can't load .* Controls /);

    const owner4 = parse(ownerUri, 4, 'export class Owner {}');
    assert.deepEqual(owner4.importsLocal, {});
    assert.deepEqual(owner4.errors, []);

    const source3 = parse(sourceUri, 3, 'namespace Form { export abstract class ButtonElement {} }');
    assert.deepEqual(source3.errors, []);
    assert.equal(source3.classes.ButtonElement.fullName, 'Form.ButtonElement');
});
