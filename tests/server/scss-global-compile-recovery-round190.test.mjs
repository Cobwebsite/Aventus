import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusGlobalSCSSFile }, { AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }, { InternalAventusFile }, { FilesManager }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'language-services/scss/GlobalFile.ts',
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/scss/LanguageService.ts',
    'files/AventusFile.ts',
    'files/FilesManager.ts',
    'GenericServer.ts',
    'settings/Settings.ts',
]);

test('global SCSS retains compiled output on Sass error and recovers diagnostics and navigation', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-scss-round190-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousFiles = FilesManager.getInstance;
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    const path = join(root, 'theme.scss.avt');
    const uri = pathToFileURL(path).href;
    const output = join(root, 'theme.css');
    const initial = ':root { --accent: red; } .card { color: var(--accent); }';
    writeFileSync(path, initial);
    const file = new InternalAventusFile(TextDocument.create(uri, 'scss', 1, initial));
    FilesManager.getInstance = () => ({ getByPath: candidate => candidate.toLowerCase() === file.path.toLowerCase() ? file : undefined });
    GenericServer.instance = { logLevel: 0, connection: { sendDiagnostics() {} } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    t.after(() => {
        FilesManager.getInstance = previousFiles;
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
    });

    const global = new AventusGlobalSCSSLanguageService();
    const project = { scssFiles: {}, globalSCSSLanguageService: global, resolveAlias: value => value, getBuilds: () => [] };
    const source = new AventusGlobalSCSSFile(file, project);
    project.scssFiles[uri] = source;
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const consumer = { documentUser: TextDocument.create(pathToFileURL(join(root, 'card.wcs.avt')).href, 'scss', 1, '.card { color: var(--accent); }') };
    const position = consumer.documentUser.positionAt(consumer.documentUser.getText().indexOf('--accent') + 3);
    const update = async (version, content) => {
        writeFileSync(path, content);
        file._documentUser = TextDocument.create(uri, 'scss', version, content);
        await file.triggerSave();
        return file.validate(false);
    };
    const check = async value => {
        assert.equal(global.getDefinition('--accent')?.value, value);
        assert.equal((await local.findDefinition(consumer, position))?.[0]?.uri, uri);
        assert.equal((await local.doHover(consumer, position))?.contents?.value, `--accent: ${value}`);
    };

    await source.addOutPath(output, '@theme');
    assert.match(readFileSync(output, 'utf8'), /--accent:\s*red/);
    assert.deepEqual(await file.validate(false), []);
    await check('red');
    const firstCompiledVersion = source.compiledVersion;

    const invalid = ':root { --accent: orange; } .card { color: var(--accent); } @error "broken";';
    const errors = await update(2, invalid);
    assert.ok(errors.some(item => item.severity === 1 && /broken/.test(item.message)));
    assert.equal(source.compiledVersion, firstCompiledVersion);
    assert.match(readFileSync(output, 'utf8'), /--accent:\s*red/);
    await check('orange');

    const fixed = ':root { --accent: blue; } .card { color: var(--accent); }';
    assert.deepEqual(await update(3, fixed), []);
    assert.ok(source.compiledVersion > firstCompiledVersion);
    assert.match(readFileSync(output, 'utf8'), /--accent:\s*blue/);
    assert.doesNotMatch(readFileSync(output, 'utf8'), /--accent:\s*red/);
    await check('blue');
});
