import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { I18nDecorator }, { ForeignKeyDecorator },
    { OverrideViewDecorator }, { StorybookDecorator }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'language-services/ts/parser/decorators/I18nDecorator.ts',
    'language-services/ts/parser/decorators/ForeignKeyDecorator.ts',
    'language-services/ts/parser/decorators/OverrideViewDecorator.ts',
    'language-services/ts/parser/decorators/StorybookDecorator.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };
let id = 0;

function parse(source) {
    const uri = `file:///D:/test/decorators-deep-${++id}.lib.avt`;
    const document = TextDocument.create(uri, 'typescript', 1, source);
    const file = { uri, versionInternal: 1, documentUser: document, documentInternal: document };
    const build = { npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '' };
    return ParserTs.parse(file, false, build).classes.Card;
}

test('Storybook reads nested slots, export selection and presentation flags from a TypeScript decorator', () => {
    const card = parse('@Storybook({export:"public",prefix:"Ui/",group:"Forms",noLive:true,noDefaultStory:true,slots:{values:{title:"Example"},inject:["slotA","slotB"]}}) export class Card {}');
    const story = StorybookDecorator.is(card.decorators[0]);
    assert.equal(story.exportType, 'public');
    assert.equal(story.prefix, 'Ui/');
    assert.equal(story.group, 'Forms');
    assert.equal(story.noLive, true);
    assert.equal(story.noDefaultStory, true);
    assert.deepEqual(story.slots, { values: { title: '"Example"' }, inject: ['"slotA"', '"slotB"'] });
});

test('I18n and OverrideView accept their typed option values through parser decorators', () => {
    const card = parse('@I18n({autoInit:false}) @OverrideView({removeViewVariables:[title,button]}) export class Card {}');
    assert.equal(I18nDecorator.is(card.decorators[0]).options.autoInit, false);
    assert.deepEqual(OverrideViewDecorator.is(card.decorators[1]).removeViewVariables, ['title', 'button']);
});

test('ForeignKey accepts qualified references and does not coerce unsupported expressions', () => {
    const card = parse('export class Card { @ForeignKey(App.Models.User) userId = 1; @ForeignKey(getModel()) dynamicId = 2; @ForeignKey(42) numericId = 3; @ForeignKey() emptyId = 4; }');
    assert.equal(ForeignKeyDecorator.is(card.properties.userId.decorators[0]).refType, 'App.Models.User');
    for (const name of ['dynamicId', 'numericId', 'emptyId']) {
        assert.equal(ForeignKeyDecorator.is(card.properties[name].decorators[0]), null);
    }
});
