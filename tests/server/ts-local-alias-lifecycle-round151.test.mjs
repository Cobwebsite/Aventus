import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('les alias locaux entre fichiers suivent remplacement et retrait de l’import', () => {
    const folder = `file:///d:/test/local-alias-round151-${process.pid}`;
    const sourceUri = `${folder.replace('d:', 'd%3A')}/source`;
    const ownerUri = `${folder}/owner.lib.avt`;
    const build = {
        npmBuilder: { unregister() {} },
        project: { resolveAlias: name => name },
        buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    function parse(uri, version, content) {
        const document = TextDocument.create(uri, 'typescript', version, content);
        return ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
    }

    const source = parse(sourceUri, 1, 'export class Alpha {}\nexport class Beta {}');
    const first = parse(ownerUri, 1, 'import { Alpha as Selected } from "./source";\nexport class Owner {}');
    assert.equal(first.importsLocal.Selected.name, 'Alpha');
    assert.equal(first.importsLocal.Selected.info, source.classes.Alpha);
    assert.equal(ParserTs.getBaseInfo('Selected', ownerUri), source.classes.Alpha);

    const second = parse(ownerUri, 2, 'import { Beta as Selected } from "./source";\nexport class Owner {}');
    assert.equal(second.importsLocal.Selected.name, 'Beta');
    assert.equal(second.importsLocal.Selected.info, source.classes.Beta);
    assert.equal(ParserTs.getBaseInfo('Selected', ownerUri), source.classes.Beta);

    const editedSource = parse(sourceUri, 2, 'export class Alpha {}\nexport class Gamma {}');
    const missing = parse(ownerUri, 3, 'import { Beta as Selected } from "./source";\nexport class Owner {}');
    assert.equal(missing.importsLocal.Selected.info, undefined);
    assert.match(missing.errors.map(error => error.message).join('\n'), /Can't load .* Beta /);
    assert.equal(ParserTs.getBaseInfo('Selected', ownerUri), null);

    const repaired = parse(ownerUri, 4, 'import { Gamma as Selected } from "./source";\nexport class Owner {}');
    assert.equal(repaired.importsLocal.Selected.info, editedSource.classes.Gamma);
    assert.equal(ParserTs.getBaseInfo('Selected', ownerUri), editedSource.classes.Gamma);

    const third = parse(ownerUri, 5, 'export class Owner {}');
    assert.deepEqual(third.importsLocal, {});
    assert.equal(ParserTs.getBaseInfo('Selected', ownerUri), null);
});
