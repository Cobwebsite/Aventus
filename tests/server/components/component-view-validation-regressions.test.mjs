import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusWebComponentLogicalFile }, { ParserHtml }, { InternalAventusFile }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'language-services/ts/component/File.ts',
    'language-services/html/parser/ParserHtml.ts',
    'files/AventusFile.ts',
    'GenericServer.ts',
    'settings/Settings.ts',
]);
GenericServer.instance = { logLevel: 4 };

let nextId = 0;
function fixture(viewText, source = 'export class Test { public testArray?: string[] = []; public example?: string; }') {
    const base = `file:///D:/test/view-validation-${++nextId}`;
    const logicUri = `${base}.wcl.avt`;
    const viewUri = `${base}.wcv.avt`;
    const logicFile = new InternalAventusFile(TextDocument.create(logicUri, 'typescript', 1, source));
    const viewFile = new InternalAventusFile(TextDocument.create(viewUri, 'Aventus HTML', 1, viewText));
    const build = {
        htmlFiles: {}, tsFiles: {}, scssFiles: {}, i18nComponentsFiles: {},
        buildConfig: { i18n: false },
        npmBuilder: { unregister() {} },
        getAvoidParsingTags: () => [], getWebComponentDefinition: () => null,
        htmlLanguageService: { getClassByTag: () => null },
        tsLanguageService: { getType: () => 'any' },
    };
    const logic = Object.create(AventusWebComponentLogicalFile.prototype);
    logic._file = logicFile;
    logic._build = build;
    logic._fullname = 'Test';
    logic._componentClassName = 'Test';
    logic._componentEnd = source.lastIndexOf('}') + 1;
    logic._space = '    ';
    logic.writeHtml = false;
    logic.writeTs = false;
    logic.lastFileVersionCreated = { html: -1, js: -1, i18n: -1 };
    logic.typeInfered = {};
    logic.viewValidatedMethods = new Map();
    logic.refreshFileParsed = () => {};
    const view = { file: viewFile, tsFile: logic, scssFile: null };
    view.fileParsed = ParserHtml.parse(view, build);
    view.version = ParserHtml.getVersion(view);
    build.htmlFiles[viewUri] = view;
    logic.recreateFileContent();
    logic.runWebCompiler = async () => {};
    return { logic, view, logicFile, viewFile, build };
}

function completionService(file) {
    const virtualFile = `view-validation-${file.uri.split('/').pop()}.ts`;
    const host = {
        getCompilationSettings: () => ({ target: ts.ScriptTarget.ESNext, strict: true }),
        getScriptFileNames: () => [virtualFile],
        getScriptVersion: () => String(file.versionInternal),
        getScriptSnapshot: () => ts.ScriptSnapshot.fromString(file.contentInternal),
        getCurrentDirectory: () => '',
        getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
        fileExists: name => name === virtualFile || ts.sys.fileExists(name),
        readFile: name => name === virtualFile ? file.contentInternal : ts.sys.readFile(name),
        readDirectory: ts.sys.readDirectory,
    };
    return { service: ts.createLanguageService(host), virtualFile };
}

test('a for inside an if is validated with the narrowed optional collection', () => {
    const viewText = '<ul>if (this.testArray) { <div>{{this.testArray.length}}</div> for (let item of this.testArray) { <li>{{item}}</li> } }</ul>';
    const { logic, logicFile } = fixture(viewText);
    const generated = logicFile.contentInternal;
    assert.match(generated, /ValidateView\(\): void \{[\s\S]*if \(this\.testArray\) \{[\s\S]*for \(let item of this\.testArray\)/);
    const { service, virtualFile } = completionService(logicFile);
    const diagnostics = service.getSemanticDiagnostics(virtualFile);
    const loopStart = generated.indexOf('for (let item of this.testArray)', generated.indexOf('ValidateView'));
    assert.ok(loopStart >= 0);
    assert.equal(diagnostics.some(item => [2532, 18048].includes(item.code) && item.start >= loopStart && item.start < loopStart + 34), false);
    const unguarded = fixture('<ul>for (let item of this.testArray) { <li>{{item}}</li> }</ul>');
    const unguardedSource = unguarded.logicFile.contentInternal;
    const unguardedLoop = unguardedSource.indexOf('for (let item of this.testArray)', unguardedSource.indexOf('ValidateView'));
    const unguardedService = completionService(unguarded.logicFile);
    assert.ok(unguardedService.service.getSemanticDiagnostics(unguardedService.virtualFile)
        .some(item => [2532, 18048].includes(item.code) && item.start >= unguardedLoop && item.start < unguardedLoop + 34));
});

for (const [name, viewText, prefix, expected] of [
    ['for', '<ul>for (let item of this.testArray ?? []) { <li>{{ite}}</li> }</ul>', 'ite', 'item'],
    ['@Context', '<section>@Context("person", this.example)<p>{{pers}}</p></section>', 'pers', 'person'],
]) {
    test(`completion offers the ${name} local before its full name is typed`, async () => {
        const { logic, logicFile, viewFile, build } = fixture(viewText);
        const { service, virtualFile } = completionService(logicFile);
        build.tsLanguageService.doComplete = async (file, position) => {
            const offset = file.documentInternal.offsetAt(position);
            const entries = service.getCompletionsAtPosition(virtualFile, offset, {})?.entries ?? [];
            const start = offset - prefix.length;
            return { isIncomplete: false, items: entries.map(entry => ({
                label: entry.name,
                textEdit: { newText: entry.name, range: {
                    start: file.documentInternal.positionAt(start), end: position,
                } },
            })) };
        };
        const source = viewFile.contentUser;
        const position = viewFile.documentUser.positionAt(source.indexOf(`{{${prefix}`) + 2 + prefix.length);
        const result = await logic.doViewCompletion(position);
        const item = result.items.find(item => item.label === expected);
        assert.ok(item, `${expected} missing from completion`);
        assert.equal(viewFile.documentUser.getText(item.textEdit.range), prefix);
        assert.equal(item.textEdit.newText, expected);
    });
}

test('logic validation republishes a separate view but leaves a shared-URI view to its parent', async () => {
    for (const sharedUri of [false, true]) {
        const logicUri = 'file:///D:/test/Card.wcl.avt';
        const viewUri = sharedUri ? logicUri : 'file:///D:/test/Card.wcv.avt';
        const calls = [];
        const logic = Object.create(AventusWebComponentLogicalFile.prototype);
        logic._file = { uri: logicUri };
        logic._build = { htmlFiles: { 'file:///D:/test/Card.wcv.avt': { file: {
            uri: viewUri, validate: async publish => calls.push(publish),
        } } } };
        logic._compilationResult = { diagnostics: [] };
        logic.runWebCompiler = async () => {};
        logic.transformDiagnosticForView = () => {};
        logic.getDeprecated = () => [];
        logic.fileParsed = null;
        await logic.onValidate();
        assert.deepEqual(calls, [!sharedUri]);
    }
});

test('changing a logic property republishes and then clears its view diagnostic', async () => {
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    const logicUri = 'file:///D:/test/revalidate.wcl.avt';
    const viewUri = 'file:///D:/test/revalidate.wcv.avt';
    const publications = [];
    GenericServer.instance = { logLevel: 4, connection: { sendDiagnostics: value => publications.push(value) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    try {
        const logicFile = new InternalAventusFile(TextDocument.create(logicUri, 'typescript', 1, 'public example2?: string;'));
        const viewFile = new InternalAventusFile(TextDocument.create(viewUri, 'Aventus HTML', 1, '<p>{{this.example}}</p>'));
        const logic = Object.create(AventusWebComponentLogicalFile.prototype);
        logic._file = logicFile;
        logic._build = { htmlFiles: { [viewUri]: { file: viewFile } } };
        logic._compilationResult = { diagnostics: [] };
        logic.runWebCompiler = async () => {};
        logic.transformDiagnosticForView = () => {
            logic.htmlDiagnostics = logicFile.contentUser.includes('example2') ? [{
                message: "Property 'example' does not exist on type 'Test'",
                range: { start: { line: 0, character: 5 }, end: { line: 0, character: 12 } },
            }] : [];
        };
        logic.getDeprecated = () => [];
        logic.fileParsed = null;
        logicFile.onValidate(() => logic.onValidate());
        viewFile.onValidate(() => Promise.resolve(logic.htmlDiagnostics));

        await logicFile.validate();
        await logicFile.triggerContentChange(TextDocument.create(logicUri, 'typescript', 2, 'public example?: string;'));
        await logicFile.validate();
        const viewPublications = publications.filter(item => item.uri === viewUri);
        assert.equal(viewPublications.length, 2);
        assert.equal(viewPublications[0].diagnostics.length, 1);
        assert.deepEqual(viewPublications[1].diagnostics, []);
        clearTimeout(logicFile.delayValidate);
    } finally {
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
    }
});
