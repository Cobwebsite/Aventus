import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusWebComponentSingleFile }, { InternalAventusFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/component/SingleFile.ts',
    'files/AventusFile.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('single-file edits refresh each present region, then retire removed style and view regions', async () => {
    const uri = 'file:///D:/test/component-single-routing-round155.wc.avt';
    const source = (title, view, style) => `<script>@TagName("demo-card") export class Card { title = "${title}"; }</script>\n` +
        (view === null ? '' : `<template><p>${view}</p></template>\n`) +
        (style === null ? '' : `<style>.card{color:${style}}</style>`);
    const file = new InternalAventusFile(TextDocument.create(uri, 'Aventus WebComponent', 1, source('First', 'Old', 'red')));
    const build = {
        tsFiles: {}, wcFiles: {}, getNamespace: () => '', getComponentPrefix: () => 'demo',
        getNamespaceForUri: () => '', addNamespace() {},
        npmBuilder: { unregister() {} }, module: 'Demo', namespaces: [], isCoreBuild: false,
        hasNpmOutput: false, hasStories: false, buildConfig: { componentPrefix: 'demo' },
        getNpmReplacementName: () => '', tsLanguageService: { addFile() {}, doValidation: () => [] },
    };
    const single = new AventusWebComponentSingleFile(file, build);
    const calls = { script: [], template: [], style: [] };
    const removed = { template: 0, style: 0 };
    for (const [region, key] of [['regionLogic', 'script'], ['regionView', 'template'], ['regionStyle', 'style']]) {
        single[region].file = {
            triggerContentChange: async doc => { calls[key].push({ text: doc.getText(), version: doc.version }); },
            triggerDelete: async () => { removed[key]++; },
        };
    }
    const edit = async (version, title, view, style) => {
        await file.triggerContentChange(TextDocument.create(uri, 'Aventus WebComponent', version, source(title, view, style)));
    };
    await edit(2, 'Second', 'Old', 'red');
    await edit(3, 'Second', 'New', 'red');
    await edit(4, 'Second', 'New', 'blue');
    assert.deepEqual(calls.script.map(v => v.version), [2, 3, 4]);
    assert.deepEqual(calls.template.map(v => v.text), ['<p>Old</p>', '<p>New</p>', '<p>New</p>']);
    assert.deepEqual(calls.style.map(v => v.text), ['.card{color:red}', '.card{color:red}', '.card{color:blue}']);
    await edit(5, 'Third', null, null);
    assert.equal(single.view, undefined);
    assert.equal(single.style, undefined);
    assert.deepEqual(removed, { template: 1, style: 1 });
    assert.equal(calls.script.at(-1).text.includes('Third'), true);
    assert.equal(calls.template.length, 3);
    assert.equal(calls.style.length, 3);
    await file.triggerDelete();
});
