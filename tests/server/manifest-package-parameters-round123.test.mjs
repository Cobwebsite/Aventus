import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ManifestPackageMd } = await loadServerModule('manifest/ManifestPackage.ts');

test('package Markdown signatures expose current optional and rest parameter rendering', () => {
    const source = ts.createSourceFile('parameters.ts', `
        export class Collector {
            collect(prefix?: string, ...values: number[]): number { return values.length; }
        }
        export function combine(prefix?: string, ...values: number[]): number { return values.length; }
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
    assert.match(markdown, /## combine\(prefix: string, values: number\)/);
    assert.match(markdown, /\| collect\(prefix: string, values: number\) \| number \|/);
    assert.doesNotMatch(markdown, /prefix\?|\.\.\.values/);
});
