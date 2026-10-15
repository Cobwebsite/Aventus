import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusJSONLanguageService } = await loadServerModule('language-services/json/LanguageService.ts');
const service = AventusJSONLanguageService.getInstance();
const uri = 'file:///round220/aventus.conf.avt';

function document(version, text) {
    return { documentUser: TextDocument.create(uri, 'json', version, text) };
}

async function labelsAt(file, marker) {
    const text = file.documentUser.getText();
    const offset = text.indexOf(marker) + 1;
    assert.ok(offset > 0, `Missing cursor marker ${marker}`);
    const result = await service.doComplete(file, file.documentUser.positionAt(offset));
    return result.items.map(item => item.label);
}

test('dependency key completion follows document revisions and remains available in separate builds', async () => {
    const first = document(1, '{"module":"Demo","dependencies":{"": "1.0.0"},"build":[{"src":[]}]}');
    const firstLabels = await labelsAt(first, '"": "1.0.0"');
    for (const name of ['Aventus@Main', 'Aventus@UI', 'Aventus@I18n', 'Aventus@Sharp', 'Aventus@Php']) {
        assert.ok(firstLabels.includes(name), `Missing ${name} in root dependencies`);
    }

    const second = document(2, '{"module":"Demo","build":[{"name":"first","src":[],"dependencies":{"": "1.0.0"}},{"name":"second","src":[],"dependencies":{"": "2.0.0"}}]}');
    const firstBuildLabels = await labelsAt(second, '"": "1.0.0"');
    const secondBuildLabels = await labelsAt(second, '"": "2.0.0"');
    for (const labels of [firstBuildLabels, secondBuildLabels]) {
        assert.ok(labels.includes('Aventus@Main'));
        assert.ok(labels.includes('Aventus@Php'));
    }

    const third = document(3, '{"module":"Demo","build":[{"src":[]}],"aliases":{"": "./src"}}');
    const aliasLabels = await labelsAt(third, '"": "./src"');
    assert.equal(aliasLabels.includes('Aventus@Main'), false);
    assert.equal(aliasLabels.includes('Aventus@Php'), false);
});
