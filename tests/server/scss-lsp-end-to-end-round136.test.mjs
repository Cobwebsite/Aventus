import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ParserHtml }, { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }] = await loadServerModules([
    'language-services/html/parser/ParserHtml.ts',
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
]);

test('SCSS completion, hover, definition, view link and format follow edits in one component', async () => {
    const globalUri = 'file:///D:/round136-theme.scss.avt';
    const viewUri = 'file:///D:/round136-card.wcv.avt';
    const styleUri = 'file:///D:/round136-card.wcs.avt';
    const global = new AventusGlobalSCSSLanguageService();
    const service = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const view = { file: { uri: viewUri }, tsFile: null };
    const style = { file: { uri: styleUri }, htmlFile: view };
    view.scssFile = style;

    const setGlobal = (content, version) => global.loadVariables({ file: {
        documentUser: TextDocument.create(globalUri, 'scss', version, content),
    } }, globalUri);
    const setView = (content, version) => {
        view.file.versionUser = version;
        view.file.documentUser = TextDocument.create(viewUri, 'Aventus HTML', version, content);
        view.fileParsed = ParserHtml.parse(view, build);
        ParserHtml.refreshStyle(view, build);
    };
    const setStyle = (content, version) => {
        style.file.documentUser = TextDocument.create(styleUri, 'scss', version, content);
        style.rules = service.getRules(style.file);
        if (view.fileParsed) ParserHtml.refreshStyle(view, build);
    };
    const at = token => style.file.documentUser.positionAt(style.file.documentUser.getText().indexOf(token) + 2);
    const checkVariable = async value => {
        const position = at('--accent');
        assert.ok((await service.doComplete(style.file, position)).items.some(item => item.label === '--accent'));
        assert.match((await service.doHover(style.file, position))?.contents?.value ?? '', new RegExp(`--accent: ${value}`));
        assert.equal((await service.findDefinition(style.file, position))?.[0]?.uri, globalUri);
    };
    const checkLink = selector => {
        const links = service.getLinkToHtml(style, at(selector));
        assert.equal(links.length, 1);
        assert.equal(links[0].uri, viewUri);
        assert.match(view.file.documentUser.getText(links[0].range), /class=/);
    };

    setGlobal(':root { --accent: red; }', 1);
    setStyle('.card { z-index: 1; color: var(--accent); }', 1);
    setView('<div class="card"></div>', 1);
    await checkVariable('red');
    checkLink('.card');

    const edits = await service.format(style.file, null, { tabSize: 2, insertSpaces: true });
    assert.ok(edits.length > 0);
    const formatted = TextDocument.applyEdits(style.file.documentUser, edits);
    assert.ok(formatted.indexOf('color: var(--accent)') < formatted.indexOf('z-index: 1'));

    setGlobal(':root { --accent: blue; }', 2);
    setStyle('.panel { color: var(--accent); }', 2);
    assert.deepEqual(service.getLinkToHtml(style, at('.panel')), []);
    setView('<section class="panel"></section>', 2);
    await checkVariable('blue');
    checkLink('.panel');

    global.removeVariables(globalUri);
    assert.equal((await service.findDefinition(style.file, at('--accent')))?.[0]?.uri, undefined);
    assert.ok(!(await service.doComplete(style.file, at('--accent'))).items.some(item => item.label === '--accent'));
});
