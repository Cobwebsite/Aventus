import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

function fixture(uri, source, version) {
    const document = TextDocument.create(uri, 'typescript', version, source);
    return { uri, versionInternal: version, documentUser: document, documentInternal: document };
}

function build() {
    return { npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '' };
}

test('bare Aventus decorators on class and members report exact ranges without entering the model', () => {
    const source = '@I18n\n@Storybook\nexport class Card {\n  @ForeignKey\n  public userId: number = 0;\n  @OverrideView\n  public render(): void {}\n}';
    const model = ParserTs.parse(fixture('file:///D:/test/decorator-errors-round55.lib.avt', source, 1), false, build());
    const names = ['I18n', 'Storybook', 'ForeignKey', 'OverrideView'];
    const errors = model.errors.filter(error => error.message === 'Missing paramaters for Decorator');
    assert.equal(errors.length, names.length);
    for (const [index, name] of names.entries()) {
        const error = errors[index];
        assert.equal(error.severity, 1);
        assert.equal(error.source, 'Aventus Ts');
        assert.equal(source.slice(model.document.offsetAt(error.range.start), model.document.offsetAt(error.range.end)), `@${name}`);
    }
    assert.deepEqual(model.classes.Card.decorators, []);
    assert.deepEqual(model.classes.Card.properties.userId.decorators, []);
    assert.deepEqual(model.classes.Card.methods.render.decorators, []);
});

test('decorator diagnostic positions and membership refresh after editing the same URI', () => {
    const uri = 'file:///D:/test/decorator-update-round55.lib.avt';
    const project = build();
    const invalid = 'export class Card {\n  @ForeignKey\n  public userId: number = 0;\n}';
    const first = ParserTs.parse(fixture(uri, invalid, 1), false, project);
    assert.equal(first.errors.filter(error => error.message === 'Missing paramaters for Decorator').length, 1);

    const valid = 'export class Card {\n  @ForeignKey(Model.User)\n  public userId: number = 0;\n}';
    const second = ParserTs.parse(fixture(uri, valid, 2), false, project);
    assert.notEqual(second, first);
    assert.equal(second.errors.some(error => error.message === 'Missing paramaters for Decorator'), false);
    assert.equal(second.classes.Card.properties.userId.decorators[0].name, 'ForeignKey');

    const moved = '\n\nexport class Card {\n  @ForeignKey\n  public userId: number = 0;\n}';
    const third = ParserTs.parse(fixture(uri, moved, 3), false, project);
    const error = third.errors.find(item => item.message === 'Missing paramaters for Decorator');
    assert.equal(error.range.start.line, 3);
    assert.equal(error.range.start.character, 2);
    assert.equal(third.classes.Card.properties.userId.decorators.length, 0);
});
