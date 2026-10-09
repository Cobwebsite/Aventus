import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ManifestPackageMd } = await loadServerModule('manifest/ManifestPackage.ts');

test('package Markdown includes class and function but currently omits exported enum and variable', () => {
    const syntax = ts.createSourceFile('exports.ts',
        'export function create(): number { return 1; } export enum Mode { Ready } export const VERSION = 2;',
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
            enums: { Mode: { fullName: 'Mode', node: syntax.statements[1] } },
            variables: { VERSION: { fullName: 'VERSION', node: syntax.statements[2] } },
        },
    };

    const markdown = new ManifestPackageMd(file).getContent();
    assert.match(markdown, /\| \[Demo\.Anchor\]\(demo\.anchor\) \| Class \|/);
    assert.match(markdown, /## create\(\)/);
    assert.match(markdown, /Return : number/);
    assert.doesNotMatch(markdown, /\bMode\b/);
    assert.doesNotMatch(markdown, /\bVERSION\b/);
});
