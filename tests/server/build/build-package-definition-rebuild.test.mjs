import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { DependencyManager }, { SettingsManager }, { AventusPackageFile }] =
    await loadServerModules([
        'project/Build.ts', 'project/DependencyManager.ts', 'settings/Settings.ts',
        'language-services/ts/package/File.ts',
    ]);

test('package rebuild replaces visible, private and global declarations with matching CSS and HTML definitions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-package-def-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousDependency = DependencyManager.instance;
    const previousSettings = SettingsManager.instance;
    DependencyManager.instance = { getPath: () => root };
    SettingsManager.instance = { settings: { useStats: false } };
    t.after(() => {
        DependencyManager.instance = previousDependency;
        SettingsManager.instance = previousSettings;
    });

    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    build.buildConfig = {
        fullname: 'Cards@front', module: 'Cards', name: 'front', version: '1.0.0',
        rawDependencies: { Base: { uri: join(root, 'Base.package.avt'), version: '1.0.0' } },
    };
    let scssDef = {};
    build.scssLanguageService = { getInternalDocumentation: () => scssDef };
    const output = join(root, 'Cards.package.avt');
    const write = async name => {
        scssDef = { variables: [{ name: `--${name.toLowerCase()}` }] };
        await build.writeBuildDocumentation([output], {
            doc: [`export class ${name} {}`],
            docNoNamespace: [`interface ${name}Global { value: number }`],
            docInvisible: [`export class ${name}Private {}`],
            stylesheets: { [name]: `.${name.toLowerCase()} { display: block }` },
            htmlDoc: { [name]: { tagName: name.toLowerCase() } },
            codeRenderInJs: [], codeNotRenderInJs: [],
        }, {
            namespace: 'Cards', available: [{ fullName: `Cards.${name}`, code: `globalThis.${name}=1;` }],
            existing: [],
        }, { path: [], npmName: '', live: false });
    };

    await write('OldCard');
    await write('NewCard');
    for (const path of [output, join(root, '@locals', 'Cards@front.package.avt')]) {
        const content = readFileSync(path, 'utf8');
        assert.match(content, /namespace Cards\{[\s\S]*export class NewCard/);
        assert.match(content, /interface NewCardGlobal/);
        assert.match(content, /declare module ___Cards \{[\s\S]*NewCardPrivate/);
        assert.doesNotMatch(content, /OldCard|oldcard/);
        const file = Object.create(AventusPackageFile.prototype);
        file._file = { contentUser: content };
        file.version = { major: 0, minor: 0, patch: 0 };
        const sections = file.separeSection();
        assert.equal(file.name, 'Cards@front');
        assert.deepEqual(JSON.parse(sections.jsSrc).available.map(item => item.fullName), ['Cards.NewCard']);
        assert.deepEqual(JSON.parse(sections.scssDefTxt), scssDef);
        assert.deepEqual(JSON.parse(sections.scssTxt), { NewCard: '.newcard { display: block }' });
        assert.deepEqual(JSON.parse(sections.htmlTxt), { NewCard: { tagName: 'newcard' } });
        assert.deepEqual(JSON.parse(sections.depsTxt), build.buildConfig.rawDependencies);
    }
});
