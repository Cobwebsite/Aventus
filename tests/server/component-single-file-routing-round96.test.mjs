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

test('a real single-file edit routes changed regions and offsets to all three child documents', async () => {
    const uri = 'file:///D:/test/component-single-routing-round96.wc.avt';
    const source = (title, color, view) => `<script>@TagName("demo-card") export class Card { title = "${title}"; }</script>\n` +
        `<template><p>${view}</p></template>\n<style>.card{color:${color}}</style>`;
    const file = new InternalAventusFile(TextDocument.create(uri, 'Aventus WebComponent', 1, source('First', 'red', 'Old')));
    const build = {
        tsFiles: {}, wcFiles: {}, getNamespace: () => '', getComponentPrefix: () => 'demo',
        getNamespaceForUri: () => '', addNamespace() {},
        npmBuilder: { unregister() {} }, module: 'Demo', namespaces: [], isCoreBuild: false,
        hasNpmOutput: false, hasStories: false, buildConfig: { componentPrefix: 'demo' },
        getNpmReplacementName: () => '', tsLanguageService: { addFile() {}, doValidation: () => [] },
    };
    const single = new AventusWebComponentSingleFile(file, build);
    const updates = { script: [], template: [], style: [] };
    for (const [region, key] of [['regionLogic', 'script'], ['regionView', 'template'], ['regionStyle', 'style']]) {
        single[region].file = { triggerContentChange: async doc => { updates[key].push(doc); } };
    }

    const second = source('Second', 'blue', 'New');
    await file.triggerContentChange(TextDocument.create(uri, 'Aventus WebComponent', 2, second));
    assert.deepEqual(Object.fromEntries(Object.entries(updates).map(([key, docs]) => [key, docs.map(doc => doc.getText())])), {
        script: ['@TagName("demo-card") export class Card { title = "Second"; }'],
        template: ['<p>New</p>'],
        style: ['.card{color:blue}'],
    });
    for (const docs of Object.values(updates)) {
        assert.equal(docs[0].uri, uri);
        assert.equal(docs[0].version, 2);
    }
    assert.equal(second.slice(single.regionLogic.start, single.regionLogic.end), updates.script[0].getText());
    assert.equal(second.slice(single.regionView.start, single.regionView.end), updates.template[0].getText());
    assert.equal(second.slice(single.regionStyle.start, single.regionStyle.end), updates.style[0].getText());

    // The document's deferred validation is unrelated to this routing assertion.
    await file.triggerDelete();
});
