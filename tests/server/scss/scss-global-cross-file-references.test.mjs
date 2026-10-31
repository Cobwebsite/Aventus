import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/scss/LanguageService.ts',
]);

function file(uri, text, version = 1) {
    return { documentUser: TextDocument.create(uri, 'scss', version, text) };
}

function at(document, name, occurrence = 0) {
    let offset = -1;
    for (let index = 0; index <= occurrence; index++) {
        offset = document.getText().indexOf(name, offset + 1);
    }
    assert.ok(offset >= 0);
    return document.positionAt(offset + 3);
}

test('global SCSS references include consumers and refresh after edits and deletion', async () => {
    const project = { scssFiles: {}, getBuilds: () => [build, otherBuild] };
    const global = new AventusGlobalSCSSLanguageService(project);
    const build = { project, scssFiles: {}, globalSCSSLanguageService: global };
    const component = new AventusSCSSLanguageService(build);
    const themeUri = 'file:///D:/round131/theme.scss.avt';
    const cardUri = 'file:///D:/round131/card.wcs.avt';
    const badgeUri = 'file:///D:/round131/badge.wcs.avt';
    const theme = file(themeUri, ':root { --accent: red; } .preview { color: var(--accent); }');
    const card = file(cardUri, '.card { color: var(--accent); }');
    const badge = file(badgeUri, '.badge { border-color: var(--accent); }');
    const otherBuild = { project, scssFiles: {}, globalSCSSLanguageService: global };
    const outside = file('file:///D:/round131/outside.wcs.avt', '/* var(--accent) */ .outside { color: var(--accent); }');

    global.loadVariables({ file: theme }, themeUri);
    project.scssFiles[themeUri] = { file: theme };
    build.scssFiles[cardUri] = { file: card };
    build.scssFiles[badgeUri] = { file: badge };
    otherBuild.scssFiles[outside.documentUser.uri] = { file: outside };
    assert.equal((await component.findDefinition(card, at(card.documentUser, '--accent')))?.[0]?.uri, themeUri);
    assert.equal((await component.findDefinition(badge, at(badge.documentUser, '--accent')))?.[0]?.uri, themeUri);
    const declarationReferences = await global.onReferences(theme, at(theme.documentUser, '--accent'));
    assert.deepEqual(declarationReferences.map(location => location.uri), [themeUri, themeUri, cardUri, badgeUri, outside.documentUser.uri]);
    assert.deepEqual((await component.onReferences(card, at(card.documentUser, '--accent'))).map(location => location.uri),
        [themeUri, themeUri, cardUri, badgeUri]);
    assert.equal(declarationReferences.filter(location => location.uri === outside.documentUser.uri).length, 1);

    const revised = file(themeUri, ':root { --tone: blue; } .preview { color: var(--tone); }', 2);
    global.loadVariables({ file: revised }, themeUri);
    project.scssFiles[themeUri] = { file: revised };
    assert.equal(await component.findDefinition(card, at(card.documentUser, '--accent')), null);
    const revisedReferences = await global.onReferences(revised, at(revised.documentUser, '--tone'));
    assert.deepEqual(revisedReferences.map(location => location.uri), [themeUri, themeUri]);
    assert.ok(revisedReferences.every(location => revised.documentUser.getText(location.range) === '--tone'));

    const revisedCard = file(cardUri, '.card { color: var(--tone); }', 2);
    const revisedBadge = file(badgeUri, '.badge { border-color: var(--tone); }', 2);
    build.scssFiles[cardUri] = { file: revisedCard };
    build.scssFiles[badgeUri] = { file: revisedBadge };
    assert.deepEqual((await global.onReferences(revised, at(revised.documentUser, '--tone'))).map(location => location.uri),
        [themeUri, themeUri, cardUri, badgeUri]);
    delete build.scssFiles[badgeUri];
    assert.deepEqual((await global.onReferences(revised, at(revised.documentUser, '--tone'))).map(location => location.uri),
        [themeUri, themeUri, cardUri]);
});

test('renaming a global variable edits each file once across overlapping builds', () => {
    const project = { scssFiles: {}, getBuilds: () => [firstBuild, secondBuild] };
    const global = new AventusGlobalSCSSLanguageService(project);
    const firstBuild = { project, scssFiles: {}, globalSCSSLanguageService: global };
    const secondBuild = { project, scssFiles: {}, globalSCSSLanguageService: global };
    const theme = file('file:///D:/round131/theme.scss.avt', ':root { --accent: red; } .preview { color: var(--accent); }');
    const shared = file('file:///D:/round131/shared.wcs.avt', '/* var(--accent) */ .shared { color: var(--accent); border: var(--accent); }');
    const other = file('file:///D:/round131/other.wcs.avt', '.other { color: var(--accent); }');
    global.loadVariables({ file: theme }, theme.documentUser.uri);
    project.scssFiles[theme.documentUser.uri] = { file: theme };
    firstBuild.scssFiles[shared.documentUser.uri] = { file: shared };
    secondBuild.scssFiles[shared.documentUser.uri] = { file: shared };
    secondBuild.scssFiles[other.documentUser.uri] = { file: other };

    const fromDeclaration = global.onRename(theme.documentUser, at(theme.documentUser, '--accent'), 'tone');
    const fromUsage = global.onRename(shared.documentUser, at(shared.documentUser, '--accent', 1), '--tone');
    assert.deepEqual(fromUsage, fromDeclaration);
    const component = new AventusSCSSLanguageService(firstBuild);
    assert.deepEqual(component.onRename(shared, at(shared.documentUser, '--accent', 1), 'tone'), fromDeclaration);
    assert.deepEqual(Object.fromEntries(Object.entries(fromDeclaration.changes).map(([uri, edits]) =>
        [uri, edits.map(edit => edit.newText)])), {
        [theme.documentUser.uri]: ['--tone', '--tone'],
        [shared.documentUser.uri]: ['--tone', '--tone'],
        [other.documentUser.uri]: ['--tone'],
    });
    assert.ok(fromDeclaration.changes[shared.documentUser.uri].every(edit =>
        shared.documentUser.getText(edit.range) === '--accent' && edit.range.start.line === 0));
    assert.equal(global.onRename(shared.documentUser, at(shared.documentUser, '--accent', 0), 'tone'), null);
    assert.equal(global.onRename(theme.documentUser, at(theme.documentUser, '--accent'), 'bad name'), null);
});
