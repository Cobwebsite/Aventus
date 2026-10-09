import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { DependencyManager }, { AventusPackageFile }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
    'language-services/ts/package/File.ts',
]);

test('one build updates component logic, view, style, translations and routed dependency outputs together', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.build-mixed-round49-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const oldServer = GenericServer.instance;
    const oldDependencies = DependencyManager.instance;
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 4,
        connection: { delayBetweenBuild: () => 0, sendNotification() {} },
    };
    DependencyManager.instance = { getPath: () => root };
    t.after(() => { GenericServer.instance = oldServer; DependencyManager.instance = oldDependencies; });

    const main = join(root, 'dist', 'main.js');
    const vendor = join(root, 'dist', 'vendor.js');
    const pkg = join(root, 'dist', 'Demo.package.avt');
    const translations = join(root, 'dist', 'i18n');
    const build = Object.create(Build.prototype);
    build.initDone = true;
    build._allowBuild = true;
    build.buildConfig = {
        fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0',
        rawDependencies: { 'Vendor@base': { version: '2.0.0' } },
        i18n: { locales: ['en', 'fr'] },
        compile: [{
            output: [{ '@default': { path: main }, Vendor: { path: vendor } }],
            package: [pkg], i18n: [{ mode: 'singleFile', output: [translations] }],
            outputNpm: { path: [], npmName: '', live: false },
        }],
    };
    build.diagnostics = new Map();
    build.scssLanguageService = { getInternalDocumentation: () => ({}) };
    build.npmBuilder = { compile: async () => ({ result: '', errors: [] }) };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const component = { name: 'First', style: '.first{color:red}', view: '<p>First</p>', en: 'First', fr: 'Premier' };
    build.tsLanguageService = { i18nFiles: {
        'file:///shared.i18n.avt': { file: { name: '@shared.i18n.avt' }, exported: { en: { title: 'App' }, fr: { title: 'Appli' } } },
    } };
    build.i18nComponentsFiles = {
        'file:///widget.i18n.avt': { file: { name: 'widget.i18n.avt' }, exported: { en: {}, fr: {} } },
    };
    build.buildOrderCompilationInfo = async () => ({
        toCompile: [component.name], libSrc: [{ lib: 'Vendor', code: '/* vendor dependency */' }], errors: [],
    });
    build.buildLocalCode = async () => ({
        codeNoNamespaceBefore: [], code: [`class ${component.name} {}`], classesName: {},
        codeNoNamespaceAfter: [], useDecorator: false,
        stylesheets: { [component.name]: component.style },
        htmlDoc: { [component.name]: component.view },
        doc: [`export class ${component.name} {}`], docNoNamespace: [], docInvisible: [],
        codeRenderInJs: [], codeNotRenderInJs: [],
    });
    const snapshot = async () => {
        build.i18nComponentsFiles['file:///widget.i18n.avt'].exported = {
            en: { widget: component.en }, fr: { widget: component.fr },
        };
        await build.build();
        const packageFile = Object.create(AventusPackageFile.prototype);
        packageFile._file = { contentUser: readFileSync(pkg, 'utf8') };
        packageFile.version = { major: 0, minor: 0, patch: 0 };
        return {
            js: readFileSync(main, 'utf8'), vendor: readFileSync(vendor, 'utf8'),
            sections: packageFile.separeSection(),
            en: JSON.parse(readFileSync(join(translations, 'en.json').toLowerCase(), 'utf8')),
            fr: JSON.parse(readFileSync(join(translations, 'fr.json').toLowerCase(), 'utf8')),
        };
    };

    const first = await snapshot();
    assert.match(first.js, /class First/);
    assert.match(first.js, /Aventus\.Style\.store\("First"/);
    assert.doesNotMatch(first.js, /vendor dependency/);
    assert.match(first.vendor, /vendor dependency/);
    assert.deepEqual(JSON.parse(first.sections.scssTxt), { First: component.style });
    assert.deepEqual(JSON.parse(first.sections.htmlTxt), { First: component.view });
    assert.deepEqual(first.en, { title: 'App', widget: 'First' });
    assert.deepEqual(first.fr, { title: 'Appli', widget: 'Premier' });

    Object.assign(component, { name: 'Second', style: '.second{color:blue}', view: '<p>Second</p>', en: 'Second', fr: 'Deuxième' });
    const second = await snapshot();
    assert.match(second.js, /class Second/);
    assert.doesNotMatch(second.js, /class First|Style\.store\("First"/);
    assert.match(second.vendor, /vendor dependency/);
    assert.deepEqual(JSON.parse(second.sections.scssTxt), { Second: component.style });
    assert.deepEqual(JSON.parse(second.sections.htmlTxt), { Second: component.view });
    assert.match(second.sections.jsDef, /export class Second/);
    assert.doesNotMatch(second.sections.jsDef, /export class First/);
    assert.deepEqual(second.en, { title: 'App', widget: 'Second' });
    assert.deepEqual(second.fr, { title: 'Appli', widget: 'Deuxième' });
});
