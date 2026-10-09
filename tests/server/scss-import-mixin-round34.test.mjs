import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusWebSCSSFile }, { InternalAventusFile }, { FilesManager }, { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'language-services/scss/File.ts',
    'files/AventusFile.ts',
    'files/FilesManager.ts',
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
    'GenericServer.ts',
    'settings/Settings.ts',
]);

function fixture(t, initial) {
    const root = 'file:///D:/round34-scss/';
    const file = (name, text) => new InternalAventusFile(TextDocument.create(root + name, 'scss', 1, text));
    const files = Object.fromEntries(Object.entries(initial).map(([name, text]) => [name, file(name, text)]));
    const byPath = new Map(Object.values(files).map(item => [item.path.replace(/\\/g, '/'), item]));
    const oldGetInstance = FilesManager.getInstance;
    FilesManager.getInstance = () => ({ getByPath: path => byPath.get(path.replace(/\\/g, '/')) });
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { errorByBuild: false } };
    const diagnostics = [];
    GenericServer.instance = { logLevel: 0, connection: { sendDiagnostics: (params, buildName) => diagnostics.push({ params, buildName }) } };
    t.after(() => { FilesManager.getInstance = oldGetInstance; GenericServer.instance = oldServer; SettingsManager.instance = oldSettings; });
    const build = {
        buildConfig: { fullname: 'round34-scss' },
        scssFiles: {}, htmlFiles: {}, tsFiles: {}, diagnostics: new Map(), hideWarnings: false,
        project: { resolveAlias: value => value },
        getNamespace: () => '',
    };
    build.globalSCSSLanguageService = new AventusGlobalSCSSLanguageService();
    build.scssLanguageService = new AventusSCSSLanguageService(build);
    return { files, build, diagnostics };
}

test('SCSS file expands nested imports and mixins, then recompiles after editing the imported partial', async t => {
    const { files, build } = fixture(t, {
        'tokens.wcs.avt': '$accent: #123456;',
        'mixins.wcs.avt': '@import "tokens"; @mixin badge($size) { border: $size solid $accent; .label { color: $accent; } }',
        'badge.wcs.avt': '@import "mixins"; .badge { @include badge(2px); }',
    });
    const badge = new AventusWebSCSSFile(files['badge.wcs.avt'], build);
    build.scssFiles[badge.file.uri] = badge;
    await badge.init();
    assert.match(badge.compileResult, /\.badge\{border:2px solid #123456\}/);
    assert.match(badge.compileResult, /\.badge \.label\{color:#123456\}/);
    const oldVersion = badge.compiledVersion;

    const changed = TextDocument.create(files['tokens.wcs.avt'].uri, 'scss', 2, '$accent: #abcdef;');
    files['tokens.wcs.avt']._documentUser = changed;
    await badge.triggerSave();
    assert.match(badge.compileResult, /#abcdef/);
    assert.doesNotMatch(badge.compileResult, /#123456/);
    assert.ok(badge.compiledVersion > oldVersion);
});

test('Sass compilation errors reach diagnostics and clear after a valid edit', async t => {
    const { files, build, diagnostics } = fixture(t, {
        'broken.wcs.avt': '.badge { @include missing-mixin(); }',
    });
    const broken = new AventusWebSCSSFile(files['broken.wcs.avt'], build);
    build.scssFiles[broken.file.uri] = broken;
    await broken.init();
    assert.equal(broken.compileResult, '');
    assert.ok(diagnostics.some(event => event.params.uri === broken.file.uri && event.params.diagnostics.some(item => /Undefined mixin/.test(item.message))));


    files['broken.wcs.avt']._documentUser = TextDocument.create(broken.file.uri, 'scss', 2, '.badge { color: green; }');
    await broken.triggerSave();
    assert.equal(broken.compileResult, '.badge{color:green}');

    assert.ok(diagnostics.some(event => event.params.uri === broken.file.uri && event.params.diagnostics.length === 0));
});


