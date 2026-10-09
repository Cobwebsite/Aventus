import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ManifestPackageMd } = await loadServerModule('manifest/ManifestPackage.ts');

test('package Markdown describes an exported web component and its slots', () => {
    const source = {
        name: 'widgets', description: 'Widget package',
        file: { uri: 'file:///widgets.package.avt' },
        build: { scssLanguageService: { getExternalDefinition: () => ({ 'demo-card': [
            { name: '--accent', type: 'color', documentation: 'Accent color' },
        ] }) } },
        srcInfo: { available: [{ type: 1, fullName: 'Demo.Card', tagName: 'demo-card', slots: { header: { doc: 'Header content' } } }] },
        fileParsed: { classes: { 'Demo.Card': {
            fullName: 'Demo.Card', name: 'Card', namespace: 'Demo',
            isWebcomponent: true, isInterface: false,
            documentation: { definitions: ['A reusable card'] },
            node: {}, parentClass: null, implementsType: [],
            properties: {}, propertiesStatic: {}, methods: {}, methodsStatic: {},
        } } },
    };
    const markdown = new ManifestPackageMd(source).getContent();
    assert.match(markdown, /# widgets/);
    assert.match(markdown, /Widget package/);
    assert.match(markdown, /Demo\.Card/);
    assert.match(markdown, /demo-card/);
    assert.match(markdown, /--accent/);
    assert.match(markdown, /header/);
});

function packageWithFunction(includeClass) {
    const syntax = ts.createSourceFile('functions.ts',
        'export function choose<T extends string>(value: T): T { return value; }',
        ts.ScriptTarget.Latest, true);
    const available = [{ type: 4, fullName: 'choose' }];
    const classes = {};
    if (includeClass) {
        available.push({ type: 1, fullName: 'Demo.Anchor' });
        classes['Demo.Anchor'] = {
            fullName: 'Demo.Anchor', name: 'Anchor', namespace: 'Demo',
            isWebcomponent: false, isInterface: false,
            node: {}, parentClass: null, implementsType: [],
            properties: {}, propertiesStatic: {}, methods: {}, methodsStatic: {},
        };
    }
    return {
        name: 'helpers', file: { uri: 'file:///helpers.package.avt' },
        build: { scssLanguageService: { getExternalDefinition: () => ({}) } },
        srcInfo: { available },
        fileParsed: {
            classes,
            functions: { choose: {
                fullName: 'choose', node: syntax.statements[0],
                documentation: { definitions: ['Returns the selected value'] },
            } },
        },
    };
}

test('package Markdown renders exported generic function signature and return type', () => {
    const markdown = new ManifestPackageMd(packageWithFunction(true)).getContent();
    assert.match(markdown, /## choose<T extends string>\(value: T\)/);
    assert.match(markdown, /Returns the selected value/);
    assert.match(markdown, /Return : T/);
});

test('function-only package currently produces no Markdown overview', () => {
    assert.equal(new ManifestPackageMd(packageWithFunction(false)).getContent(), '');
});
