import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { AventusGlobalSCSSLanguageService } = await loadServerModule(
    'language-services/scss/GlobalLanguageService.ts');

test('global CSS references ignore var syntax in a quoted string and follow later revisions', () => {
    const sourceUri = 'file:///D:/round270/tokens.scss.avt';
    const consumerUri = 'file:///D:/round270/card.wcs.avt';
    const source = TextDocument.create(sourceUri, 'scss', 1, ':root { --tone: red; }');
    let consumer = TextDocument.create(consumerUri, 'scss', 1,
        '.card { content: "var(--tone)"; color: var(--tone); }');
    const project = {
        scssFiles: { [consumerUri]: { file: { documentUser: consumer } } },
        getBuilds: () => [],
    };
    const service = new AventusGlobalSCSSLanguageService(project);
    service.loadVariables({ file: { documentUser: source } }, sourceUri);
    const position = source.positionAt(source.getText().indexOf('--tone') + 3);
    const references = () => service.getGlobalReferences(source, position);
    const consumerRanges = () => references().filter(item => item.uri === consumerUri)
        .map(item => consumer.offsetAt(item.range.start));

    assert.deepEqual(consumerRanges(), [consumer.getText().lastIndexOf('--tone')]);
    assert.deepEqual(service.onRename(source, position, 'shade').changes[consumerUri]
        .map(edit => consumer.getText(edit.range)), ['--tone']);
    const quotedPosition = consumer.positionAt(consumer.getText().indexOf('--tone') + 3);
    assert.equal(service.getGlobalReferences(consumer, quotedPosition), null);
    assert.equal(service.onRename(consumer, quotedPosition, 'shade'), null);

    consumer = TextDocument.create(consumerUri, 'scss', 2,
        '.card { content: "literal"; color: var(--tone); }');
    project.scssFiles[consumerUri] = { file: { documentUser: consumer } };
    assert.deepEqual(consumerRanges(), [consumer.getText().indexOf('--tone')]);
    assert.deepEqual(service.onRename(source, position, 'shade').changes[consumerUri]
        .map(edit => consumer.getText(edit.range)), ['--tone']);
    assert.equal(service.getGlobalReferences(consumer, consumer.positionAt(consumer.getText().indexOf('literal') + 3)), null);
});
