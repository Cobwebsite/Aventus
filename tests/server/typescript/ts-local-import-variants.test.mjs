import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

function fixture(label) {
    const folder = `file:///d:/test/local-import-${label}-round152-${process.pid}`;
    const sourceUri = `${folder.replace('d:', 'd%3A')}/source`;
    const ownerUri = `${folder}/owner.lib.avt`;
    const build = {
        npmBuilder: { unregister() {} },
        project: { resolveAlias: name => name },
        buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const parse = (uri, version, content) => {
        const document = TextDocument.create(uri, 'typescript', version, content);
        return ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
    };
    return { parse, sourceUri, ownerUri };
}

test('un import local de type renommé suit édition de la déclaration et retrait de l’import', () => {
    const { parse, sourceUri, ownerUri } = fixture('type');
    const source = parse(sourceUri, 1, 'export interface Shape { size: number }\nexport type Color = string;');
    const first = parse(ownerUri, 1, 'import type { Shape as Chosen } from "./source";\nexport class Owner {}');
    assert.equal(first.importsLocal.Chosen.name, 'Shape');
    assert.equal(first.importsLocal.Chosen.isTypeImport, true);
    assert.equal(first.importsLocal.Chosen.info, source.classes.Shape);

    const second = parse(ownerUri, 2, 'import { type Color as Chosen } from "./source";\nexport class Owner {}');
    assert.equal(second.importsLocal.Chosen.name, 'Color');
    assert.equal(second.importsLocal.Chosen.isTypeImport, true);
    assert.equal(second.importsLocal.Chosen.info, source.aliases.Color);

    parse(sourceUri, 2, 'export interface Shape { size: number }');
    const missing = parse(ownerUri, 3, 'import { type Color as Chosen } from "./source";\nexport class Owner {}');
    assert.equal(missing.importsLocal.Chosen.info, undefined);
    assert.match(missing.errors.map(error => error.message).join('\n'), /Can't load .* Color /);

    const removed = parse(ownerUri, 4, 'export class Owner {}');
    assert.deepEqual(removed.importsLocal, {});
    assert.equal(removed.errors.some(error => /Can't load/.test(error.message)), false);
});

test('un import namespace local invalide ne conserve pas de diagnostic après remplacement', () => {
    const { parse, sourceUri, ownerUri } = fixture('namespace');
    const source = parse(sourceUri, 1, 'export class Alpha {}');
    const invalid = parse(ownerUri, 1, 'import * as Group from "./source";\nexport class Owner {}');
    assert.deepEqual(invalid.importsLocal, {});
    assert.match(invalid.errors.map(error => error.message).join('\n'), /can't use namespace import/);

    const repaired = parse(ownerUri, 2, 'import { Alpha as Group } from "./source";\nexport class Owner {}');
    assert.equal(repaired.importsLocal.Group.info, source.classes.Alpha);
    assert.equal(repaired.errors.some(error => /can't use namespace import/.test(error.message)), false);

    const removed = parse(ownerUri, 3, 'export class Owner {}');
    assert.deepEqual(removed.importsLocal, {});
    assert.equal(removed.errors.some(error => /can't use namespace import/.test(error.message)), false);
});
