import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ManifestPackageMd } = await loadServerModule('manifest/ManifestPackage.ts');

test('package Markdown preserves optional and rest parameters for generic functions and methods', () => {
    const source = ts.createSourceFile('parameters.ts', `
        export class Collector {
            collect<T extends number>(prefix?: string, ...values: T[]): number { return values.length; }
        }
        export function combine<T extends number>(prefix?: string, ...values: T[]): number { return values.length; }
    `, ts.ScriptTarget.Latest, true);
    const classNode = source.statements[0];
    const methodNode = classNode.members[0];
    const functionNode = source.statements[1];
    const file = {
        name: 'parameters', file: { uri: 'file:///parameters.package.avt' },
        build: { scssLanguageService: { getExternalDefinition: () => ({}) } },
        srcInfo: { available: [
            { type: 1, fullName: 'Collector' },
            { type: 4, fullName: 'combine' },
        ] },
        fileParsed: {
            classes: { Collector: {
                fullName: 'Collector', name: 'Collector', namespace: '', node: classNode,
                isWebcomponent: false, isInterface: false, parentClass: null, implementsType: [],
                properties: {}, propertiesStatic: {}, methodsStatic: {},
                methods: { collect: { name: 'collect', node: methodNode, isAbstract: false } },
            } },
            functions: { combine: { fullName: 'combine', node: functionNode } },
        },
    };

    const markdown = new ManifestPackageMd(file).getContent();
    assert.match(markdown, /## combine<T extends number>\(prefix\?: string, \.\.\.values: T\[\]\)/);
    assert.match(markdown, /\| collect<T extends number>\(prefix\?: string, \.\.\.values: T\[\]\) \| number \|/);
});
