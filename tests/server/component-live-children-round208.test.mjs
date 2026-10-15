import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusWebComponentSingleFile }, { InternalAventusFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/component/SingleFile.ts', 'files/AventusFile.ts', 'GenericServer.ts',
]);

test('single-file edits move live child documents with their regions across reordered sections', async () => {
    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///D:/test/component-live-children-round208.wc.avt';
    const make = (title, color, view, reordered) => {
        const script = `<script>@TagName("demo-card") export class Card { title = "${title}"; }</script>`;
        const style = `<style>.card{color:${color}}</style>`;
        const template = `<template><p>${view}</p></template>`;
        return reordered ? `${template}\n${style}\n${script}` : `${script}\n${template}\n${style}`;
    };
    const build = {
        tsFiles: {}, wcFiles: {}, scssFiles: {}, htmlFiles: {}, i18nComponentsFiles: {},
        getNamespace: () => '', getComponentPrefix: () => 'demo', getNamespaceForUri: () => '', addNamespace() {},
        npmBuilder: { unregister() {} }, module: 'Demo', namespaces: [], isCoreBuild: false,
        hasNpmOutput: false, hasStories: false, buildConfig: { componentPrefix: 'demo' },
        getNpmReplacementName: () => '', tsLanguageService: { addFile() {}, doValidation: () => [] },
    };
    const file = new InternalAventusFile(TextDocument.create(uri, 'Aventus WebComponent', 1, make('First', 'red', 'Old', false)));
    const single = new AventusWebComponentSingleFile(file, build);
    build.wcFiles[uri] = single;
    const children = [single.logic, single.view, single.style];
    assert.ok(children.every(Boolean));
    // The child document update is real; suppress only unrelated compiler/parser work.
    for (const child of children) {
        child.file.onContentChangeCb[child.uuidEvents.onContentChange] = async () => {};
        child.file.validate = async () => [];
    }
    file.validate = async () => [];
    try {
        for (const [version, title, color, view, reordered] of [
            [2, 'Second', 'blue', 'New', true],
            [3, 'Third', 'green', 'Latest', false],
        ]) {
            const source = make(title, color, view, reordered);
            await file.triggerContentChange(TextDocument.create(uri, 'Aventus WebComponent', version, source));
            assert.equal(single.logic, children[0]);
            assert.equal(single.view, children[1]);
            assert.equal(single.style, children[2]);
            for (const region of [single.regionLogic, single.regionView, single.regionStyle]) {
                assert.equal(region.file.file.contentUser, source.slice(region.start, region.end));
                assert.equal(region.file.file.documentUser.version, version);
                assert.equal(region.file.file.uri, uri);
            }
            assert.match(single.logic.file.contentUser, new RegExp(title));
            assert.match(single.view.file.contentUser, new RegExp(view));
            assert.match(single.style.file.contentUser, new RegExp(color));
        }
    } finally {
        await file.triggerDelete();
        GenericServer.instance = previousServer;
    }
});
