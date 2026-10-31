import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { Build }, { AventusWebSCSSFile }, { AventusGlobalSCSSFile },
    { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'project/Build.ts',
    'language-services/scss/File.ts', 'language-services/scss/GlobalFile.ts', 'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
]);

function fixture(t) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-style-move-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const uri = path => pathToFileURL(join(root, path)).href;
    const project = Object.create(Project.prototype);
    const build = Object.create(Build.prototype);
    project.builds = [build];
    build.project = project;
    project.scssFiles = {};
    project.globalSCSSLanguageService = new AventusGlobalSCSSLanguageService(project);
    build.scssFiles = {};
    build.scssLanguageService = new AventusSCSSLanguageService(build);
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = { demo: project };
    const file = (path, source) => {
        const fileUri = uri(path);
        return { uri: fileUri, documentUser: TextDocument.create(fileUri, 'scss', 1, source) };
    };
    const addComponentStyle = (path, source) => {
        const style = Object.create(AventusWebSCSSFile.prototype);
        style._file = file(path, source);
        style._build = build;
        build.scssFiles[style.file.uri] = style;
        return style.file;
    };
    const addGlobalStyle = (path, source) => {
        const current = file(path, source);
        const style = Object.create(AventusGlobalSCSSFile.prototype);
        style._file = current;
        style._project = project;
        project.scssFiles[current.uri] = style;
        return current;
    };
    return { uri, manager, project, addComponentStyle, addGlobalStyle };
}

test('component styles update relative @import, @use and @forward paths after a move', async t => {
    const { uri, manager, project, addComponentStyle } = fixture(t);
    manager.projects = { first: project, second: project };
    const source = '@import "../shared/_tokens.wcs.avt";\n@use "../shared/_tokens.wcs.avt";\n@forward "../shared/_tokens.wcs.avt";';
    const style = addComponentStyle('src/Card.wcs.avt', source);
    const edits = await manager.onRename([{
        oldUri: uri('shared/_tokens.wcs.avt'),
        newUri: uri('styles/_tokens.wcs.avt'),
    }]);
    assert.equal(edits[style.uri].length, 3);
    assert.equal(TextDocument.applyEdits(style.documentUser, edits[style.uri]),
        source.replaceAll('../shared/_tokens.wcs.avt', '../styles/_tokens.wcs.avt'));
});

test('component and global styles preserve alias imports while updating relative @import', async t => {
    const { uri, manager, project, addComponentStyle, addGlobalStyle } = fixture(t);
    project.config = { aliases: { '@fcts': './static/css/_functions.gs.avt' } };
    const source = '@import "../shared/_tokens.gs.avt";\n@import "@fcts";\n// @import "../shared/_tokens.gs.avt";';
    const component = addComponentStyle('src/Calendar.wcs.avt', source);
    const global = addGlobalStyle('src/Theme.gs.avt', source);
    const edits = await manager.onRename([{
        oldUri: uri('shared/_tokens.gs.avt'),
        newUri: uri('styles/_tokens.gs.avt'),
    }, {
        oldUri: uri('static/css/_functions.gs.avt'),
        newUri: uri('static/css/_functions-new.gs.avt'),
    }]);
    assert.deepEqual(Object.keys(edits).sort(), [component.uri, global.uri].sort());
    for (const style of [component, global]) {
        assert.equal(TextDocument.applyEdits(style.documentUser, edits[style.uri]),
            '@import "../styles/_tokens.gs.avt";\n@import "@fcts";\n// @import "../shared/_tokens.gs.avt";');
    }
    assert.deepEqual(project.config.aliases, { '@fcts': './static/css/_functions.gs.avt' });
});
