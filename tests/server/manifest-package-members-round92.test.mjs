import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ManifestPackageMd } = await loadServerModule('manifest/ManifestPackage.ts');

test('package Markdown separates public instance and static members, slots and CSS variables', () => {
    const source = ts.createSourceFile('card.ts', `
        class Card {
            title: string;
            private secret: string;
            static count: number;
            open(force?: boolean): void {}
            protected reset(): void {}
            static create(): Card { throw 0; }
        }
    `, ts.ScriptTarget.Latest, true);
    const members = source.statements[0].members;
    const property = (node, visibility = {}) => ({ name: node.name.text, type: node.type, decorators: [], documentation: { definitions: [`Docs for ${node.name.text}`] }, ...visibility });
    const method = (node, visibility = {}) => ({ name: node.name.text, node, documentation: { definitions: [`Docs for ${node.name.text}`] }, ...visibility });
    const file = {
        name: 'widgets', file: { uri: 'file:///widgets.package.avt' },
        build: { scssLanguageService: { getExternalDefinition: () => ({ 'demo-card': [
            { name: '--tone', type: '<color>', documentation: 'Card tone' },
        ] }) } },
        srcInfo: { available: [{ type: 1, fullName: 'Demo.Card', tagName: 'demo-card', slots: { body: { doc: 'Body content' } } }] },
        fileParsed: { classes: { 'Demo.Card': {
            fullName: 'Demo.Card', name: 'Card', namespace: 'Demo', node: source.statements[0],
            isWebcomponent: true, isInterface: false, parentClass: null, implementsType: [],
            properties: { title: property(members[0]), secret: property(members[1], { isPrivate: true }) },
            propertiesStatic: { count: property(members[2]) },
            methods: { open: method(members[3]), reset: method(members[4], { isProtected: true }) },
            methodsStatic: { create: method(members[5]) },
        } } },
    };

    const markdown = new ManifestPackageMd(file).getContent();
    assert.match(markdown, /### JS Props[\s\S]*\| title \| string \| Docs for title \|/);
    assert.match(markdown, /### JS Props Static[\s\S]*\| count \| number \| Docs for count \|/);
    assert.match(markdown, /### Methods[\s\S]*\| open\(force: boolean\) \| void \| Docs for open \|/);
    assert.match(markdown, /### Methods Static[\s\S]*\| create\(\) \| Card \| Docs for create \|/);
    assert.match(markdown, /### HTML Slots[\s\S]*\| body \| Body content \|/);
    assert.match(markdown, /### CSS Props[\s\S]*\| --tone \| <color> \| Card tone \|/);
    assert.doesNotMatch(markdown, /\bsecret\b|\breset\b/);
});
