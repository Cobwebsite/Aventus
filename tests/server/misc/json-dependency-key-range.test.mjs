import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { AventusJSONLanguageService } = await loadServerModule('language-services/json/LanguageService.ts');

test('dependency key navigation selects the matching build and follows config edits', () => {
    const service = AventusJSONLanguageService.getInstance();
    const uri = 'file:///workspace/aventus.conf.avt';
    const file = {};
    const update = (version, content) => {
        file.documentUser = TextDocument.create(uri, 'json', version, content);
    };
    const selected = (build, key) => {
        const range = service.getDependencyKeyRange(file, build, key);
        return range && file.documentUser.getText(range);
    };

    update(1, JSON.stringify({
        dependencies: { Shared: 'root.package.avt' },
        build: [
            { name: 'first', dependencies: { Shared: 'first.package.avt', Alpha: 'alpha.package.avt' } },
            { name: 'second', dependencies: { Shared: 'second.package.avt', Beta: 'beta.package.avt' } },
        ],
    }, null, 2));
    const first = service.getDependencyKeyRange(file, 'first', 'Shared');
    const second = service.getDependencyKeyRange(file, 'second', 'Shared');
    const root = service.getDependencyKeyRange(file, 'missing', 'Shared');
    assert.equal(file.documentUser.getText(first), '"Shared"');
    assert.equal(file.documentUser.getText(second), '"Shared"');
    assert.equal(file.documentUser.getText(root), '"Shared"');
    assert.ok(first.start.line < second.start.line);
    assert.ok(root.start.line < first.start.line);
    assert.equal(selected('first', 'Beta'), null);
    assert.equal(selected('second', 'Beta'), '"Beta"');

    update(2, JSON.stringify({
        dependencies: { Shared: 'root.package.avt' },
        build: [
            { name: 'second', dependencies: { Gamma: 'gamma.package.avt' } },
            { name: 'first', dependencies: { Alpha: 'alpha.package.avt' } },
        ],
    }, null, 2));
    assert.equal(selected('second', 'Shared'), '"Shared"');
    assert.equal(selected('first', 'Shared'), '"Shared"');
    assert.equal(selected('second', 'Gamma'), '"Gamma"');
    assert.equal(selected('first', 'Beta'), null);

    update(3, JSON.stringify({ build: [{ name: 'first', dependencies: {} }] }));
    assert.equal(selected('first', 'Shared'), null);
});
