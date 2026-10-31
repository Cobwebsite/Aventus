import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('plusieurs alias locaux suivent séparément les éditions de leurs déclarations et de leurs imports', () => {
    const folder = `file:///d:/test/local-alias-batch-round194-${process.pid}`;
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

    const source1 = parse(sourceUri, 1, 'export class First {}\nexport interface Second { value: number }');
    const owner1 = parse(ownerUri, 1, 'import { First as A, Second as B } from "./source";\nexport class Owner {}');
    assert.equal(owner1.importsLocal.A.info, source1.classes.First);
    assert.equal(owner1.importsLocal.B.info, source1.classes.Second);
    assert.deepEqual(owner1.errors, []);

    const source2 = parse(sourceUri, 2, 'export class First {}\nexport interface Replacement { value: string }');
    const owner2 = parse(ownerUri, 2, 'import { First as A, Second as B } from "./source";\nexport class Owner {}');
    assert.equal(owner2.importsLocal.A.info, source2.classes.First);
    assert.equal(owner2.importsLocal.B.info, undefined);
    assert.match(owner2.errors.map(error => error.message).join('\n'), /Can't load .* Second /);

    const owner3 = parse(ownerUri, 3, 'import { Replacement as B, First as C } from "./source";\nexport class Owner {}');
    assert.deepEqual(Object.keys(owner3.importsLocal).sort(), ['B', 'C']);
    assert.equal(owner3.importsLocal.B.info, source2.classes.Replacement);
    assert.equal(owner3.importsLocal.C.info, source2.classes.First);
    assert.deepEqual(owner3.errors, []);

    const owner4 = parse(ownerUri, 4, 'export class Owner {}');
    assert.deepEqual(owner4.importsLocal, {});
    assert.deepEqual(owner4.errors, []);
});
