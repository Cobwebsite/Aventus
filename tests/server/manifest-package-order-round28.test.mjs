import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ManifestPackageMd } = await loadServerModule('manifest/ManifestPackage.ts');

test('package Markdown sorts exported classes and functions regardless of declaration order', () => {
    const source = ts.createSourceFile('helpers.ts', 'export function middle(value: string): string { return value; }', ts.ScriptTarget.Latest, true);
    const makeClass = name => ({
        fullName: name, name, namespace: 'Demo', isWebcomponent: false, isInterface: false,
        node: {}, parentClass: null, implementsType: [],
        properties: {}, propertiesStatic: {}, methods: {}, methodsStatic: {},
    });
    const file = {
        name: 'helpers', file: { uri: 'file:///helpers.package.avt' },
        build: { scssLanguageService: { getExternalDefinition: () => ({}) } },
        srcInfo: { available: [
            { type: 1, fullName: 'Zulu' },
            { type: 4, fullName: 'middle' },
            { type: 1, fullName: 'Alpha' },
        ] },
        fileParsed: {
            classes: { Zulu: makeClass('Zulu'), Alpha: makeClass('Alpha') },
            functions: { middle: { fullName: 'middle', node: source.statements[0] } },
        },
    };

    const markdown = new ManifestPackageMd(file).getContent();
    assert.match(markdown, /\| \[Alpha\]\(alpha\) \| Class \|/);
    assert.match(markdown, /\| \[Zulu\]\(zulu\) \| Class \|/);
    assert.ok(markdown.indexOf('| [Alpha](alpha)') < markdown.indexOf('| [Zulu](zulu)'));
    assert.ok(markdown.indexOf('## Alpha') < markdown.indexOf('## Zulu'));
    assert.ok(markdown.indexOf('## Alpha') < markdown.indexOf('## middle(value: string)'));
    assert.ok(markdown.indexOf('## middle(value: string)') < markdown.indexOf('## Zulu'));
    assert.match(markdown, /## middle\(value: string\)[\s\S]*Return : string/);
});
