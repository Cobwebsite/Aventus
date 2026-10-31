import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusGlobalSCSSFile }, { AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }, { InternalAventusFile }, { FilesManager }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'language-services/scss/GlobalFile.ts',
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/scss/LanguageService.ts',
    'files/AventusFile.ts',
    'files/FilesManager.ts',
    'GenericServer.ts',
    'settings/Settings.ts',
]);

test('two saved global SCSS sources change definition priority across two consumers and outputs', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-scss-round221-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const oldFiles = FilesManager.getInstance;
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    const diagnostics = [];
    GenericServer.instance = { logLevel: 0, connection: { sendDiagnostics: value => diagnostics.push(value) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    t.after(() => {
        FilesManager.getInstance = oldFiles;
        GenericServer.instance = oldServer;
        SettingsManager.instance = oldSettings;
    });

    const makeSource = (name, text) => {
        const path = join(root, name);
        const uri = pathToFileURL(path).href;
        writeFileSync(path, text);
        return { path, uri, file: new InternalAventusFile(TextDocument.create(uri, 'scss', 1, text)) };
    };
    const first = makeSource('first.scss.avt', ':root { --accent: red; } .first { color: var(--accent); }');
    const second = makeSource('second.scss.avt', ':root { --accent: blue; } .second { color: var(--accent); }');
    const files = new Map([first, second].map(source => [source.file.path.toLowerCase(), source.file]));
    FilesManager.getInstance = () => ({ getByPath: path => files.get(path.toLowerCase()) });

    const global = new AventusGlobalSCSSLanguageService();
    const project = { scssFiles: {}, globalSCSSLanguageService: global, resolveAlias: value => value, getBuilds: () => [] };
    const firstGlobal = new AventusGlobalSCSSFile(first.file, project);
    const secondGlobal = new AventusGlobalSCSSFile(second.file, project);
    project.scssFiles[first.uri] = firstGlobal;
    project.scssFiles[second.uri] = secondGlobal;
    const firstOutput = join(root, 'first.css');
    const secondOutput = join(root, 'second.css');
    await firstGlobal.addOutPath(firstOutput, '@first');
    await secondGlobal.addOutPath(secondOutput, '@second');

    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const consumers = ['card', 'badge'].map(name => {
        const uri = pathToFileURL(join(root, `${name}.wcs.avt`)).href;
        const documentUser = TextDocument.create(uri, 'scss', 1, `.${name} { color: var(--accent); }`);
        return { documentUser, position: documentUser.positionAt(documentUser.getText().indexOf('--accent') + 3) };
    });
    const check = async (source, value) => {
        const definition = global.getDefinition('--accent');
        assert.equal(definition?.uri, source.uri);
        assert.equal(definition?.value, value);
        assert.equal(source.file.documentUser.getText(definition.range), '--accent');
        for (const consumer of consumers) {
            assert.deepEqual((await local.findDefinition(consumer, consumer.position))?.[0], { uri: source.uri, range: definition.range });
            assert.equal((await local.doHover(consumer, consumer.position))?.contents?.value, `--accent: ${value}`);
        }
    };
    const save = async (source, version, content) => {
        writeFileSync(source.path, content);
        source.file._documentUser = TextDocument.create(source.uri, 'scss', version, content);
        await source.file.triggerSave();
        assert.deepEqual(await source.file.validate(false), []);
    };

    await check(first, 'red');
    assert.match(readFileSync(firstOutput, 'utf8'), /--accent:\s*red/);
    assert.match(readFileSync(secondOutput, 'utf8'), /--accent:\s*blue/);

    await save(first, 2, ':root { --other: green; } .first { color: var(--other); }');
    await check(second, 'blue');
    assert.match(readFileSync(firstOutput, 'utf8'), /--other:\s*green/);
    assert.doesNotMatch(readFileSync(firstOutput, 'utf8'), /--accent/);
    assert.match(readFileSync(secondOutput, 'utf8'), /--accent:\s*blue/);

    await save(second, 2, ':root { --accent: purple; } .second { color: var(--accent); }');
    await check(second, 'purple');
    assert.match(readFileSync(secondOutput, 'utf8'), /--accent:\s*purple/);

    await save(first, 3, ':root { --accent: orange; } .first { color: var(--accent); }');
    await check(first, 'orange');
    assert.match(readFileSync(firstOutput, 'utf8'), /--accent:\s*orange/);
    assert.deepEqual(diagnostics, []);
});
