import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { compileString } from 'sass';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { DependencyManager }, { AventusPackageFile }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
    'language-services/ts/package/File.ts',
]);

test('buildLocalCode collects multiple global SCSS files in registration order and drops deleted entries', async () => {
    const build = Object.create(Build.prototype);
    build.noNamespaceUri = {};
    build.tsFiles = {};
    build.globalComponentSCSSFiles = {
        'file:///alpha.wcs.avt': { globalName: '@alpha', compileResult: compileString(':root { --alpha: 1; }', { style: 'compressed' }).css.trim() },
        'file:///beta.wcs.avt': { globalName: '@beta', compileResult: compileString(':root { --beta: 2; }', { style: 'compressed' }).css.trim() },
    };
    let local = await build.buildLocalCode([], 'Demo');
    assert.deepEqual(Object.keys(local.stylesheets), ['@alpha', '@beta']);
    assert.match(local.stylesheets['@alpha'], /--alpha/);
    assert.match(local.stylesheets['@beta'], /--beta/);

    delete build.globalComponentSCSSFiles['file:///alpha.wcs.avt'];
    build.globalComponentSCSSFiles['file:///beta.wcs.avt'].compileResult =
        compileString(':root { --beta: 3; }', { style: 'compressed' }).css.trim();
    local = await build.buildLocalCode([], 'Demo');
    assert.deepEqual(Object.keys(local.stylesheets), ['@beta']);
    assert.match(local.stylesheets['@beta'], /--beta: 3/);
});

test('build aggregates ordered global and component styles in JavaScript and package, then replaces removed styles', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.build-styles-round35-'));
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
    const pkg = join(root, 'dist', 'Demo.package.avt');
    const build = Object.create(Build.prototype);
    build.initDone = true;
    build._allowBuild = true;
    build.buildConfig = {
        fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0', rawDependencies: {},
        compile: [{ output: [{ '@default': { path: main } }], package: [pkg],
            outputNpm: { path: [], npmName: '', live: false } }],
    };
    build.diagnostics = new Map();
    build.scssLanguageService = { getInternalDocumentation: () => ({}) };
    build.npmBuilder = { compile: async () => ({ result: '', errors: [] }) };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const css = source => compileString(source, { style: 'compressed' }).css.trim();
    const styles = new Map([
        ['@base', css(':root { --base: red; }')],
        ['@theme', css(':root { --theme: blue; }')],
    ]);
    const components = new Map([
        ['First', css('.first { color: red; }')],
        ['Second', css('.second { color: blue; }')],
    ]);
    build.buildOrderCompilationInfo = async () => ({ toCompile: [], libSrc: [], errors: [] });
    build.buildLocalCode = async () => ({
        codeNoNamespaceBefore: [], code: [...components].map(([name, style]) =>
            `class ${name} { static style = \`${style}\`; }`),
        classesName: {}, codeNoNamespaceAfter: [], useDecorator: false,
        stylesheets: Object.fromEntries(styles), htmlDoc: {}, doc: [], docNoNamespace: [],
        docInvisible: [], codeRenderInJs: [], codeNotRenderInJs: [],
    });

    const inspect = async () => {
        await build.build();
        const js = readFileSync(main, 'utf8');
        const packageFile = Object.create(AventusPackageFile.prototype);
        packageFile._file = { contentUser: readFileSync(pkg, 'utf8') };
        packageFile.version = { major: 0, minor: 0, patch: 0 };
        return { js, packageStyles: JSON.parse(packageFile.separeSection().scssTxt) };
    };
    const first = await inspect();
    assert.deepEqual(first.packageStyles, Object.fromEntries(styles));
    assert.ok(first.js.indexOf('Style.store("@base"') < first.js.indexOf('Style.store("@theme"'));
    assert.ok(first.js.indexOf('class First') < first.js.indexOf('class Second'));
    for (const marker of [...styles.values(), ...components.values()]) {
        assert.ok(first.js.includes(marker), marker);
    }

    styles.delete('@base');
    styles.set('@theme', css(':root { --theme: green; }'));
    components.delete('First');
    components.set('Second', css('.second { color: green; }'));
    const second = await inspect();
    assert.deepEqual(second.packageStyles, Object.fromEntries(styles));
    for (const marker of ['@base', 'class First', first.packageStyles['@base'], '.first{color:red}', first.packageStyles['@theme'], '.second{color:blue}']) {
        assert.ok(!second.js.includes(marker), marker);
    }
    assert.ok(second.js.includes(styles.get('@theme')));
    assert.match(second.js, /\.second\{color:green\}/);
});
