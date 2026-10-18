import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusWebComponentSingleFile }, { AventusWebSCSSFile }, { AventusHTMLFile }, { InternalAventusFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/component/SingleFile.ts',
    'language-services/scss/File.ts',
    'language-services/html/File.ts',
    'files/AventusFile.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('a single-file component recreates real view and style children after their regions return', async () => {
    const uri = 'file:///D:/test/component-single-recreate-round288.wc.avt';
    const source = (view, style) => '<script>export class Card {}</script>' +
        (view === null ? '' : `<template><p>${view}</p></template>`) +
        (style === null ? '' : `<style>p{color:${style}}</style>`);
    const file = new InternalAventusFile(TextDocument.create(uri, 'Aventus WebComponent', 1, source(null, null)));
    const build = {
        tsFiles: {}, wcFiles: {}, scssFiles: {}, htmlFiles: {}, getNamespace: () => '', getComponentPrefix: () => 'demo',
        getNamespaceForUri: () => '', addNamespace() {},
        npmBuilder: { unregister() {} }, module: 'Demo', namespaces: [], isCoreBuild: false,
        hasNpmOutput: false, hasStories: false, buildConfig: { componentPrefix: 'demo' },
        getNpmReplacementName: () => '', tsLanguageService: { addFile() {}, doValidation: () => [] },
    };
    const originalStyleInit = AventusWebSCSSFile.prototype.init;
    const originalViewInit = AventusHTMLFile.prototype.init;
    AventusWebSCSSFile.prototype.init = async function () { build.scssFiles[this.file.uri] = this; };
    AventusHTMLFile.prototype.init = async function () { build.htmlFiles[this.file.uri] = this; };
    try {
        const single = new AventusWebComponentSingleFile(file, build);
        single.regionLogic.file = { triggerContentChange: async () => {} };
        assert.equal(single.view, undefined);
        assert.equal(single.style, undefined);

        await file.triggerContentChange(TextDocument.create(uri, 'Aventus WebComponent', 2, source('First', 'red')));
        assert.ok(single.view instanceof AventusHTMLFile);
        assert.ok(single.style instanceof AventusWebSCSSFile);
        assert.equal(single.view.file.documentInternal.getText(), '<p>First</p>');
        assert.equal(single.style.file.documentInternal.getText(), 'p{color:red}');
        const firstView = single.view;
        const firstStyle = single.style;

        await file.triggerContentChange(TextDocument.create(uri, 'Aventus WebComponent', 3, source(null, null)));
        assert.equal(single.view, undefined);
        assert.equal(single.style, undefined);

        await file.triggerContentChange(TextDocument.create(uri, 'Aventus WebComponent', 4, source('Second', 'blue')));
        assert.notEqual(single.view, firstView);
        assert.notEqual(single.style, firstStyle);
        assert.equal(single.view.file.documentInternal.getText(), '<p>Second</p>');
        assert.equal(single.style.file.documentInternal.getText(), 'p{color:blue}');
    } finally {
        AventusWebSCSSFile.prototype.init = originalStyleInit;
        AventusHTMLFile.prototype.init = originalViewInit;
        await file.triggerDelete();
    }
});



