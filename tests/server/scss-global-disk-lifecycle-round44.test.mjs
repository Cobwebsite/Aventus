import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusGlobalSCSSFile }, { AventusGlobalSCSSLanguageService }, { InternalAventusFile }, { FilesManager }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'language-services/scss/GlobalFile.ts',
    'language-services/scss/GlobalLanguageService.ts',
    'files/AventusFile.ts',
    'files/FilesManager.ts',
    'GenericServer.ts',
    'settings/Settings.ts',
]);

test('two global SCSS files export from disk, refresh definitions, and drop a deleted source', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-global-round44-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const oldFiles = FilesManager.getInstance;
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    const source = (name, content) => {
        const path = join(root, name);
        writeFileSync(path, content);
        const uri = pathToFileURL(path).href;
        return { path, file: new InternalAventusFile(TextDocument.create(uri, 'scss', 1, readFileSync(path, 'utf8'))) };
    };
    const first = source('first.scss.avt', ':root { --primary: red; --shared: 1px; }');
    const second = source('second.scss.avt', ':root { --secondary: blue; --shared: 2px; }');
    const files = new Map([first, second].map(item => [item.file.path.toLowerCase(), item.file]));
    FilesManager.getInstance = () => ({ getByPath: path => files.get(path.toLowerCase()) });
    GenericServer.instance = { logLevel: 0, connection: { sendDiagnostics() {} } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    t.after(() => { FilesManager.getInstance = oldFiles; GenericServer.instance = oldServer; SettingsManager.instance = oldSettings; });

    const project = {
        scssFiles: {}, globalSCSSLanguageService: new AventusGlobalSCSSLanguageService(),
        resolveAlias: value => value, getBuilds: () => [],
    };
    const firstGlobal = new AventusGlobalSCSSFile(first.file, project);
    const secondGlobal = new AventusGlobalSCSSFile(second.file, project);
    project.scssFiles[first.file.uri] = firstGlobal;
    project.scssFiles[second.file.uri] = secondGlobal;
    const firstOutput = join(root, 'first.css');
    const secondOutput = join(root, 'second.css');
    await firstGlobal.addOutPath(firstOutput, '@first');
    await secondGlobal.addOutPath(secondOutput, '@second');
    assert.match(readFileSync(firstOutput, 'utf8'), /--primary:\s*red/);
    assert.match(readFileSync(secondOutput, 'utf8'), /--secondary:\s*blue/);
    assert.equal(project.globalSCSSLanguageService.getDefinition('--shared').uri, first.file.uri);

    const changed = ':root { --secondary: green; --shared: 3px; }';
    writeFileSync(second.path, changed);
    second.file._documentUser = TextDocument.create(second.file.uri, 'scss', 2, readFileSync(second.path, 'utf8'));
    await second.file.triggerSave();
    assert.match(readFileSync(secondOutput, 'utf8'), /--secondary:\s*green/);
    assert.equal(project.globalSCSSLanguageService.getDefinition('--secondary').value, 'green');

    await first.file.triggerDelete();
    delete project.scssFiles[first.file.uri];
    assert.equal(project.globalSCSSLanguageService.getDefinition('--primary'), undefined);
    assert.equal(project.globalSCSSLanguageService.getDefinition('--shared').value, '3px');
    assert.equal(project.globalSCSSLanguageService.getDefinition('--shared').uri, second.file.uri);
});
