import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModule } from './helpers/load-ts.mjs';

const { DocumentationInfo } = await loadServerModule('language-services/ts/parser/DocumentationInfo.ts');

function documentation(source) {
    const file = ts.createSourceFile('docs.ts', source, ts.ScriptTarget.Latest, true);
    return new DocumentationInfo(file.statements[0]);
}

test('documentation parser extracts description, parameters, return and template tags', () => {
    const info = documentation(`/**
 * Formats a value.
 * @param value input value
 * @returns formatted value
 * @template T value type
 */
function format<T>(value: T): string { return String(value); }`);
    assert.equal(info.hasDoc, true);
    assert.ok(info.definitions[0].includes('Formats a value.'));
    assert.equal(info.documentationParameters.value, 'input value');
    assert.equal(info.documentationReturn, 'formatted value');
    assert.equal(info.documentationTemplates.T, 'value type');
    assert.ok(info.fullDefinitions[0].includes('@param value'));
});

test('documentation parser handles undocumented nodes and named slots', () => {
    const absent = documentation('function plain() {}');
    assert.equal(absent.hasDoc, false);
    assert.deepEqual(absent.definitions, []);

    const info = documentation(`/** Widget.
 * @slot header - Header content
 */
class Widget {}`);
    assert.equal(info.documentationSlots.header, 'Header content');
});
