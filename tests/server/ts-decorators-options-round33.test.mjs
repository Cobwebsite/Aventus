import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { I18nDecorator }, { ForeignKeyDecorator },
    { OverrideViewDecorator }, { StateActiveDecorator }, { StateInactiveDecorator },
    { StateChangeDecorator }, { DefaultStateActiveDecorator }, { DefaultStateInactiveDecorator }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'language-services/ts/parser/decorators/I18nDecorator.ts',
    'language-services/ts/parser/decorators/ForeignKeyDecorator.ts',
    'language-services/ts/parser/decorators/OverrideViewDecorator.ts',
    'language-services/ts/parser/decorators/StateActiveDecorator.ts',
    'language-services/ts/parser/decorators/StateInactiveDecorator.ts',
    'language-services/ts/parser/decorators/StateChangeDecorator.ts',
    'language-services/ts/parser/decorators/DefaultStateActiveDecorator.ts',
    'language-services/ts/parser/decorators/DefaultStateInactiveDecorator.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };
let id = 0;

function parse(source) {
    const uri = `file:///D:/test/decorator-options-${++id}.lib.avt`;
    const document = TextDocument.create(uri, 'typescript', 1, source);
    const file = { uri, versionInternal: 1, documentUser: document, documentInternal: document };
    const build = { npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '' };
    return ParserTs.parse(file, false, build).classes.Card;
}

test('I18n reads quoted option names and OverrideView decodes quoted string values', () => {
    const card = parse('@I18n({"autoInit":false}) @OverrideView({"removeViewVariables":["title","button"]}) export class Card {}');
    assert.deepEqual(I18nDecorator.is(card.decorators[0]).options, { autoInit: false });
    assert.deepEqual(OverrideViewDecorator.is(card.decorators[1]).removeViewVariables, ['title', 'button']);
    const defaults = parse('@I18n() @OverrideView() export class Card {}');
    assert.deepEqual(I18nDecorator.is(defaults.decorators[0]).options, { autoInit: true });
    assert.deepEqual(OverrideViewDecorator.is(defaults.decorators[1]).removeViewVariables, []);
});

test('ForeignKey accepts an identifier reference and rejects a string argument', () => {
    const card = parse('export class Card { @ForeignKey(Model.User) public userId: number = 0; @ForeignKey("Model.User") public otherId: number = 0; }');
    assert.equal(ForeignKeyDecorator.is(card.properties.userId.decorators[0]).refType, 'Model.User');
    assert.equal(ForeignKeyDecorator.is(card.properties.otherId.decorators[0]), null);
});

test('state decorators retain state and manager names with their operation names', () => {
    const card = parse('export class Card { @StateActive(State.Ready, Manager) public active(): void {} @StateInactive(State.Ready, Manager) public inactive(): void {} @StateChange(State.Ready, Manager) public change(): void {} }');
    const cases = [
        ['active', StateActiveDecorator, 'active'],
        ['inactive', StateInactiveDecorator, 'inactive'],
        ['change', StateChangeDecorator, 'askChange'],
    ];
    for (const [name, Type, operation] of cases) {
        const state = Type.is(card.methods[name].decorators[0]);
        assert.equal(state.stateName, 'State.Ready');
        assert.equal(state.managerName, 'Manager');
        assert.equal(state.functionName, operation);
    }
});

test('state decorators emit quoted routes and preserve manager instance calls', () => {
    const card = parse('export class Card { @StateActive("/state1", Manager) public active(): void {} @StateInactive("/state1", Manager.getInstance()) public inactive(): void {} @StateChange("/state1", Manager) public change(): void {} }');
    for (const [name, Type, manager] of [
        ['active', StateActiveDecorator, 'Manager'],
        ['inactive', StateInactiveDecorator, 'Manager.getInstance()'],
        ['change', StateChangeDecorator, 'Manager'],
    ]) {
        const state = Type.is(card.methods[name].decorators[0]);
        assert.equal(state.stateName, '"/state1"');
        assert.equal(state.managerName, manager);
    }
});

test('default state decorators preserve manager instance calls', () => {
    const card = parse('export class Card { @DefaultStateActive(Manager.getInstance()) public active(): void {} @DefaultStateInactive(Manager.getInstance()) public inactive(): void {} }');
    assert.equal(DefaultStateActiveDecorator.is(card.methods.active.decorators[0]).managerName, 'Manager.getInstance()');
    assert.equal(DefaultStateInactiveDecorator.is(card.methods.inactive.decorators[0]).managerName, 'Manager.getInstance()');
});

test('state decorators replace the root of manager expressions', () => {
    const card = parse('export class Card { @StateInactive("/state1", Manager.getInstance()) public inactive(): void {} @DefaultStateActive(Manager.getInstance()) public active(): void {} }');
    for (const method of [card.methods.inactive, card.methods.active]) {
        method.decorators[0].baseInfo = { dependenciesLocations: { Manager: { replacement: 'App.Manager' } } };
    }
    assert.equal(StateInactiveDecorator.is(card.methods.inactive.decorators[0]).managerName, 'App.Manager.getInstance()');
    assert.equal(DefaultStateActiveDecorator.is(card.methods.active.decorators[0]).managerName, 'App.Manager.getInstance()');
});
