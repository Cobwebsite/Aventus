import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('un import de package Aventus mal formé est remplacé puis retiré sans diagnostic ou alias ancien', () => {
    const uri = 'file:///D:/round147/package-import.lib.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        project: { resolveAlias: name => name },
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    function parse(version, source) {
        const document = TextDocument.create(uri, 'typescript', version, source);
        return ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
    }

    const malformed = parse(1, 'import { Shape } from "models.package.avt"; export class User {}');
    assert.ok(malformed.errors.some(error => error.message.includes('package import is malformated')));
    assert.equal(malformed.packages.Shape, undefined);

    const valid = parse(2, 'import { Shape } from "demo:models.package.avt"; export class User {}');
    assert.notEqual(valid, malformed);
    assert.equal(valid.errors.some(error => error.message.includes('package import is malformated')), false);
    assert.equal(valid.packages.Shape.fullname, 'models.Shape');

    const changed = parse(3, 'import { Other } from "demo:models.package.avt"; export class User {}');
    assert.equal(changed.packages.Shape, undefined);
    assert.equal(changed.packages.Other.fullname, 'models.Other');

    const removed = parse(4, 'export class User {}');
    assert.deepEqual(removed.packages, {});
    assert.equal(removed.errors.some(error => error.message.includes('package import is malformated')), false);
});

test('un import Aventus renommé signale une erreur puis le nom direct est accepté après édition', () => {
    const uri = 'file:///D:/round147/renamed-package-import.lib.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        project: { resolveAlias: name => name },
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    function parse(version, source) {
        const document = TextDocument.create(uri, 'typescript', version, source);
        return ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
    }

    const renamed = parse(1, 'import { Shape as LocalShape } from "demo:models.package.avt";');
    assert.deepEqual(renamed.errors.map(error => error.message), ["error can't use renamed import"]);
    assert.deepEqual(renamed.packages, {});

    const direct = parse(2, 'import { Shape } from "demo:models.package.avt";');
    assert.deepEqual(direct.errors, []);
    assert.deepEqual(direct.packages, { Shape: { fullname: 'models.Shape' } });
});
