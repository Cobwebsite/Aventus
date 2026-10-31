import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ManifestPackageMd } = await loadServerModule('manifest/ManifestPackage.ts');

function packageWithDescriptions() {
    const source = ts.createSourceFile('card.ts', 'class Card { title: string; }', ts.ScriptTarget.Latest, true);
    const classNode = source.statements[0];
    return {
        name: 'widgets', file: { uri: 'file:///widgets.package.avt' },
        build: { scssLanguageService: { getExternalDefinition: () => ({}) } },
        srcInfo: { available: [{ type: 1, fullName: 'Demo.Card' }] },
        fileParsed: { classes: { 'Demo.Card': {
            fullName: 'Demo.Card', name: 'Card', namespace: 'Demo', node: classNode,
            isWebcomponent: false, isInterface: false, parentClass: null, implementsType: [],
            documentation: { definitions: ['First line', 'Second line'] },
            properties: { title: {
                name: 'title', type: classNode.members[0].type, decorators: [],
                documentation: { definitions: ['Shown in the overview | and details', 'with more text'] },
            } },
            propertiesStatic: {}, methods: {}, methodsStatic: {},
        } } },
    };
}

test('package Markdown keeps ordered class documentation and separates multiline table cells', () => {
    const markdown = new ManifestPackageMd(packageWithDescriptions()).getContent();
    assert.match(markdown, /\| \[Demo\.Card\]\(#pkg-demo-card\) \| Class \| First line Second line \|/);
    assert.match(markdown, /## Demo\.Card\r?\n\r?\nFirst line\r?\nSecond line/);
    assert.match(markdown, /\| title \| string \| Shown in the overview \\\| and details with more text \|/);
});

test('package Markdown escapes description pipes within a table cell', () => {
    const markdown = new ManifestPackageMd(packageWithDescriptions()).getContent();
    const header = markdown.split(/\r?\n/).find(line => line.startsWith('| Name | Type | Description |'));
    const property = markdown.split(/\r?\n/).find(line => line.startsWith('| title |'));
    assert.equal((header.match(/\|/g) ?? []).length, 4);
    assert.equal((property.match(/(?<!\\)\|/g) ?? []).length, 4);
});
