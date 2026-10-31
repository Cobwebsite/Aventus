import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
]);

function document(text) {
    return { documentUser: TextDocument.create('file:///round93.scss.avt', 'scss', 1, text) };
}

test('SCSS selector documentation completion follows replacement and removal', async () => {
    const globalSCSSLanguageService = new AventusGlobalSCSSLanguageService();
    const service = new AventusSCSSLanguageService({ globalSCSSLanguageService });
    const uri = 'file:///component.scss.avt';
    const source = document('.card { .child {  } }');
    const position = source.documentUser.positionAt(source.documentUser.getText().indexOf('{  }') + 2);

    service.addInternalDefinition(uri, { '.child': [{ name: 'initial-state' }] });
    let labels = (await service.doComplete(source, position)).items.map(item => item.label);
    assert.ok(labels.includes('initial-state'));

    service.addInternalDefinition(uri, { '.child': [{ name: 'updated-state' }] });
    labels = (await service.doComplete(source, position)).items.map(item => item.label);
    assert.ok(labels.includes('updated-state'));
    assert.ok(!labels.includes('initial-state'));

    service.removeInternalDefinition(uri);
    labels = (await service.doComplete(source, position)).items.map(item => item.label);
    assert.ok(!labels.includes('updated-state'));
});
