import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusGlobalSCSSFile }, { AventusGlobalSCSSLanguageService }, { InternalAventusFile }, { FilesManager }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'language-services/scss/GlobalFile.ts', 'language-services/scss/GlobalLanguageService.ts',
    'files/AventusFile.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

test('global SCSS import chain recompiles the root when a nested partial changes', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-scss-chain-round54-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const oldFiles = FilesManager.getInstance;
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    const source = (name, content) => {
        const path = join(root, name);
        writeFileSync(path, content);
        const uri = pathToFileURL(path).href;
        return { path, file: new InternalAventusFile(TextDocument.create(uri, 'scss', 1, content)) };
    };
    const palette = source('_palette.gs.avt', '$tone: red;');
    const theme = source('_theme.gs.avt', '@import "palette"; $theme: $tone;');
    const main = source('main.gs.avt', '@import "theme"; .card { color: $theme; }');
    const files = new Map([palette, theme, main].map(item => [normalize(item.file.path).toLowerCase(), item.file]));
    FilesManager.getInstance = () => ({ getByPath: path => files.get(normalize(path).toLowerCase()) });
    GenericServer.instance = { logLevel: 0, connection: { sendDiagnostics() {} } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    t.after(() => { FilesManager.getInstance = oldFiles; GenericServer.instance = oldServer; SettingsManager.instance = oldSettings; });

    const project = { scssFiles: {}, globalSCSSLanguageService: new AventusGlobalSCSSLanguageService(), resolveAlias: value => value, getBuilds: () => [] };
    const mainGlobal = new AventusGlobalSCSSFile(main.file, project);
    project.scssFiles[main.file.uri] = mainGlobal;
    const output = join(root, 'dist', 'main.css');
    await mainGlobal.addOutPath(output, '@main');
    assert.match(readFileSync(output, 'utf8'), /\.card\{color:red\}/);
    assert.ok(project.scssFiles[theme.file.uri]);
    assert.ok(project.scssFiles[palette.file.uri]);

    const changed = '$tone: blue;';
    writeFileSync(palette.path, changed);
    palette.file._documentUser = TextDocument.create(palette.file.uri, 'scss', 2, changed);
    await palette.file.triggerSave();
    assert.match(readFileSync(output, 'utf8'), /\.card\{color:blue\}/);
    assert.equal(mainGlobal.resultCompiled, '.card{color:blue}');
});
