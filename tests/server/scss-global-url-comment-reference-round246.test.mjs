import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
]);

test('une URL https dans une règle masque les références CSS qui la suivent sur la ligne', () => {
    const globalUri = 'file:///D:/round246/tokens.scss.avt';
    const consumerUri = 'file:///D:/round246/card.wcs.avt';
    const globalsDoc = TextDocument.create(globalUri, 'scss', 1, ':root { --tone: red; }');
    const consumerDoc = TextDocument.create(consumerUri, 'scss', 1,
        '.card { background-image: url("https://example.test/image.svg"); color: var(--tone); }');
    const consumer = { file: { documentUser: consumerDoc } };
    const project = { scssFiles: { [consumerUri]: consumer }, getBuilds: () => [] };
    const service = new AventusGlobalSCSSLanguageService(project);
    service.loadVariables({ file: { documentUser: globalsDoc } }, globalUri);
    const definitionPosition = globalsDoc.positionAt(globalsDoc.getText().indexOf('--tone') + 3);
    const references = service.getGlobalReferences(globalsDoc, definitionPosition);

    assert.equal(service.getDefinition('--tone')?.uri, globalUri);
    assert.deepEqual(references?.map(location => location.uri), [globalUri]);
    assert.deepEqual(Object.keys(service.onRename(globalsDoc, definitionPosition, '--shade')?.changes ?? {}),
        [globalUri]);

    consumerDoc.update([{ text: '.card { background-image: url("data:image/svg+xml;base64,aA=="); color: var(--tone); }' }], 2);
    const restored = service.getGlobalReferences(globalsDoc, definitionPosition);
    assert.deepEqual(restored?.map(location => location.uri), [globalUri, consumerUri]);
    assert.equal(consumerDoc.getText(restored[1].range), '--tone');
    assert.deepEqual(Object.keys(service.onRename(globalsDoc, definitionPosition, '--shade').changes),
        [globalUri, consumerUri]);
});
