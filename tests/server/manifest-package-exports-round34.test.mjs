import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ManifestPackageMd } = await loadServerModule('manifest/ManifestPackage.ts');

test('package Markdown includes exported class, function, enum, and variable', () => {
    const syntax = ts.createSourceFile('exports.ts',
        'export function create(): number { return 1; } export enum Mode { Ready = 1, Waiting } export const VERSION: number = 2;',
        ts.ScriptTarget.Latest, true);
    const file = {
        name: 'mixed', file: { uri: 'file:///mixed.package.avt' },
        build: { scssLanguageService: { getExternalDefinition: () => ({}) } },
        srcInfo: { available: [
            { type: 5, fullName: 'VERSION' },
            { type: 6, fullName: 'Mode' },
            { type: 4, fullName: 'create' },
            { type: 1, fullName: 'Demo.Anchor' },
        ] },
        fileParsed: {
            classes: { 'Demo.Anchor': {
                fullName: 'Demo.Anchor', name: 'Anchor', namespace: 'Demo',
                isWebcomponent: false, isInterface: false, node: {},
                parentClass: null, implementsType: [], properties: {},
                propertiesStatic: {}, methods: {}, methodsStatic: {},
            } },
            functions: { create: { fullName: 'create', node: syntax.statements[0] } },
            enums: { Mode: { fullName: 'Mode', node: syntax.statements[1], documentation: { definitions: ['Available modes'] } } },
            variables: { VERSION: { fullName: 'VERSION', type: 'const', node: syntax.statements[2].declarationList.declarations[0], documentation: { definitions: ['Package version'] } } },
        },
    };

    const markdown = new ManifestPackageMd(file).getContent();
    assert.match(markdown, /\| \[Demo\.Anchor\]\(demo\.anchor\) \| Class \|/);
    assert.match(markdown, /## create\(\)/);
    assert.match(markdown, /Return : number/);
    assert.match(markdown, /\| \[Mode\]\(mode\) \| Enum \| Available modes \|/);
    assert.match(markdown, /## Mode/);
    assert.match(markdown, /\| Ready \| 1 \|/);
    assert.match(markdown, /\| Waiting \|  \|/);
    assert.match(markdown, /\| \[VERSION\]\(version\) \| Variable \| Package version \|/);
    assert.match(markdown, /## VERSION/);
    assert.match(markdown, /Declaration : const/);
    assert.match(markdown, /Type : number/);
    assert.match(markdown, /Initial value : 2/);
});

test('package Markdown renders an enum and variable without a class export', () => {
    const syntax = ts.createSourceFile('standalone.ts',
        'export enum Mode { Ready } export let VERSION = 2;',
        ts.ScriptTarget.Latest, true);
    const file = {
        name: 'standalone', file: { uri: 'file:///standalone.package.avt' },
        build: { scssLanguageService: { getExternalDefinition: () => ({}) } },
        srcInfo: { available: [
            { type: 6, fullName: 'Mode' },
            { type: 5, fullName: 'VERSION' },
        ] },
        fileParsed: {
            enums: { Mode: { fullName: 'Mode', node: syntax.statements[0] } },
            variables: { VERSION: { fullName: 'VERSION', type: 'let', node: syntax.statements[1].declarationList.declarations[0] } },
        },
    };
    const markdown = new ManifestPackageMd(file).getContent();
    assert.match(markdown, /# standalone/);
    assert.match(markdown, /## Mode/);
    assert.match(markdown, /## VERSION/);
    assert.match(markdown, /Declaration : let/);
});
