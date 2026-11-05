import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { chromium } from 'playwright';

const fixture = resolve(import.meta.dirname, 'fixtures/reference-project');
const cli = resolve(import.meta.dirname, '../../cli/out/cli.js');

function copyProject(t) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-runtime-project-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    cpSync(fixture, root, { recursive: true,
        filter: source => source !== join(fixture, 'dist'),
    });
    cpSync(resolve(import.meta.dirname, '../../base/src/attributes/Attributes.def.avt'),
        join(root, 'src/Attributes.def.avt'));
    return root;
}

function runBuild(root) {
    return spawnSync(process.execPath, [cli, 'build', join(root, 'aventus.conf.avt'), '--json'], {
        cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024,
        env: { ...process.env, APPDATA: join(root, 'appdata') },
    });
}

function buildProject(root) {
    const result = runBuild(root);
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.success, true, result.stdout);
    assert.equal(report.builds['RuntimeReference@Main'].success, true);
    const output = join(root, 'dist/runtime-reference.js');
    assert.equal(existsSync(output), true);
    return { code: readFileSync(output, 'utf8'), report };
}

async function openCompiledPage(t, code) {
    const browser = await chromium.launch();
    t.after(() => browser.close());
    const page = await browser.newPage();
    await page.goto('about:blank');
    await page.addScriptTag({ content: code });
    return page;
}

test('a real Aventus project compiles its loop and two-way binding into an executable bundle', t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    assert.match(code, /RuntimeList\.Tag=`rt-runtime-list`/);
    assert.match(code, /acceptTypes\(/);
    assert.match(code, /simple:\{data: `this\.items`,item:`item`\}/);
    assert.match(code, /"injectionName": "value"/);
    assert.match(code, /"eventNames": \[\s*"change",\s*"input"/);

    const registrations = new Map();
    const customElements = {
        get: name => registrations.get(name),
        define: (name, constructor) => registrations.set(name, constructor),
    };
    const ElementStub = class {};
    const globals = {
        console, setTimeout, clearTimeout, Blob, FormData, Response, Headers, performance,
        HTMLElement: ElementStub, Element: ElementStub, Window: ElementStub,
        Node: ElementStub, SVGElement: ElementStub, SVGGElement: ElementStub,
        SVGRectElement: ElementStub, SVGEllipseElement: ElementStub,
        SVGSVGElement: ElementStub, SVGTextElement: ElementStub,
        CSSStyleSheet: class { replaceSync() {} }, File: ElementStub,
        customElements, window: { customElements }, document: {},
        localStorage: { getItem: () => null, setItem() {} }, navigator: { language: 'en-gb' },
    };
    runInNewContext(code, globals);
    assert.equal(typeof globals.RuntimeReference.RuntimeList, 'function');
    assert.equal(registrations.get('rt-runtime-list'), globals.RuntimeReference.RuntimeList);
    assert.equal(globals.__aventusRuntimeStatic, 1);
});

test('@Injectable compiles an accessible field and publishes its injection attribute', async t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeInjectable.wc.avt'];
    config.build[0].compile[0].package = './dist/RuntimeReference@Main.package.avt';
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const packageText = readFileSync(join(root, 'dist/RuntimeReference@Main.package.avt'), 'utf8');
    assert.match(packageText, /"rt-runtime-injectable"/);
    assert.match(packageText, /"name":\s*":message"/);
    const page = await openCompiledPage(t, code);
    assert.equal(await page.evaluate(() => {
        const element = document.createElement('rt-runtime-injectable');
        element.message = 'injected';
        document.body.append(element);
        const result = element.readMessage();
        element.remove();
        return result;
    }), 'injected');
});

test('an invalid @TagName reports the lowercase and hyphen rule', t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/invalid-tag/RuntimeInvalidTag.wcl.avt'),
        join(root, 'src/RuntimeInvalidTag.wcl.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeInvalidTag.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const build = runBuild(root);
    assert.equal(build.error, undefined, build.error?.message);
    const report = JSON.parse(build.stdout);
    assert.equal(report.success, false);
    assert.match(JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics), /tag name must be in lower case and have a - inside/);
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
});

test('a component logic file without WebComponent reports the missing component rule', t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/no-component/RuntimeNoComponent.wcl.avt'),
        join(root, 'src/RuntimeNoComponent.wcl.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeNoComponent.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const build = runBuild(root);
    assert.equal(build.error, undefined, build.error?.message);
    const report = JSON.parse(build.stdout);
    assert.equal(report.success, false);
    assert.match(JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics), /Can't found a web component class to compile inside/);
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
});

test('Data type identity is generated and Convertible requires its declared identity', async t => {
    for (const [file, shouldSucceed] of [
        ['RuntimeMissingFullname.data.avt', true],
        ['RuntimeMissingConvertible.lib.avt', false]
    ]) {
        const root = copyProject(t);
        cpSync(join(root, 'cases/missing-fullname', file), join(root, 'src', file));
        const configPath = join(root, 'aventus.conf.avt');
        const config = JSON.parse(readFileSync(configPath, 'utf8'));
        config.build[0].compile[0].input = [`./src/${file}`];
        writeFileSync(configPath, JSON.stringify(config, null, 2));
        const build = runBuild(root);
        assert.equal(build.error, undefined, build.error?.message);
        const report = JSON.parse(build.stdout);
        assert.equal(report.success, shouldSucceed, `${file}: ${build.stdout}`);
        if (shouldSucceed) {
            const code = readFileSync(join(root, 'dist/runtime-reference.js'), 'utf8');
            const page = await openCompiledPage(t, code);
            const fullname = await page.evaluate(() => RuntimeReference.RuntimeMissingFullname.Fullname);
            assert.equal(fullname, 'RuntimeReference.RuntimeMissingFullname');
        } else {
            assert.match(JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics), /Missing static property Fullname/);
            assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
        }
    }
});

test('duplicate exported class names in separate files report a collision', t => {
    const root = copyProject(t);
    for (const file of ['RuntimeDuplicateA.lib.avt', 'RuntimeDuplicateB.lib.avt']) {
        cpSync(join(root, 'cases/duplicate-name', file), join(root, 'src', file));
    }
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeDuplicateA.lib.avt', './src/RuntimeDuplicateB.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const build = runBuild(root);
    assert.equal(build.error, undefined, build.error?.message);
    const report = JSON.parse(build.stdout);
    assert.equal(report.success, false, build.stdout);
    const diagnostics = JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics);
    assert.equal((diagnostics.match(/The name RuntimeDuplicate is registered more than once/g) ?? []).length, 2);
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
});

test('view references require matching handlers and ViewElement fields', t => {
    const root = copyProject(t);
    mkdirSync(join(root, 'src/RuntimeInvalidView'));
    for (const file of ['RuntimeInvalidView.wcl.avt', 'RuntimeInvalidView.wcv.avt']) {
        cpSync(join(root, 'cases/invalid-view', file), join(root, 'src/RuntimeInvalidView', file));
    }
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeInvalidView/RuntimeInvalidView.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const build = runBuild(root);
    assert.equal(build.error, undefined, build.error?.message);
    const report = JSON.parse(build.stdout);
    assert.equal(report.success, false, build.stdout);
    const diagnostics = JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics);
    assert.match(diagnostics, /missing method missingHandler/);
    assert.match(diagnostics, /Missing variable view elementmissingElement/);
    assert.match(diagnostics, /Can't find the variable unusedElement inside the view/);
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
});

test('a component with an unresolved parent reports the parent parsing failure', t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/invalid-parent/RuntimeInvalidParent.wcl.avt'),
        join(root, 'src/RuntimeInvalidParent.wcl.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeInvalidParent.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const build = runBuild(root);
    assert.equal(build.error, undefined, build.error?.message);
    const report = JSON.parse(build.stdout);
    assert.equal(report.success, false, build.stdout);
    assert.match(JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics), /can't found the path for parent UnknownParent/);
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
});

test('malformed project configuration reports an error', t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/invalid-config/aventus.conf.txt'), join(root, 'aventus.conf.avt'));
    const build = runBuild(root);
    assert.equal(build.error, undefined, build.error?.message);
    const report = JSON.parse(build.stdout);
    assert.equal(build.status, 1, build.stdout + build.stderr);
    assert.equal(report.success, false);
    assert.deepEqual(report.builds, {});
    assert.match(JSON.stringify(report.diagnostics), /aventus\.conf\.avt.*(?:parse|syntax|error)/i);
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
});

test('two WebComponent classes in one logic file report the component count rule', t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/multiple-components/RuntimeMultiple.wcl.avt'),
        join(root, 'src/RuntimeMultiple.wcl.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeMultiple.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const build = runBuild(root);
    assert.equal(build.error, undefined, build.error?.message);
    const report = JSON.parse(build.stdout);
    assert.equal(report.success, false);
    assert.match(JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics), /Only one class is allowed inside a file/);
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
});

test('uninitialized typed fields report definite-assignment and nullable rules', t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/invalid-nullability/RuntimeInvalidNullability.wcl.avt'),
        join(root, 'src/RuntimeInvalidNullability.wcl.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeInvalidNullability.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const build = runBuild(root);
    assert.equal(build.error, undefined, build.error?.message);
    const report = JSON.parse(build.stdout);
    assert.equal(report.success, false);
    const diagnostics = JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics);
    assert.match(diagnostics, /You must add ! after the name to avoid undefined value/);
    assert.match(diagnostics, /You must add \? after the name to allow undefined value/);
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
});

test('a Data file reports missing interface, initializer, function and variable rules', t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/invalid-data/RuntimeInvalidData.data.avt'),
        join(root, 'src/RuntimeInvalidData.data.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeInvalidData.data.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const build = runBuild(root);
    assert.equal(build.error, undefined, build.error?.message);
    const report = JSON.parse(build.stdout);
    assert.equal(report.success, false);
    const diagnostics = JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics);
    assert.match(diagnostics, /must implement Aventus\.IData/);
    assert.match(diagnostics, /has no initializer and is not definitely assigned/);
    assert.match(diagnostics, /Function can only be used inside lib\.avt file/);
    assert.match(diagnostics, /Variables can only be used inside lib\.avt file/);
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
});

test('static Aventus script is included once in the compiled browser bundle', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    assert.match(code, /__aventusRuntimeStatic/);
    assert.doesNotMatch(code, /declare global\s*\{/);
    const page = await openCompiledPage(t, code);
    const value = await page.evaluate(() => globalThis.__aventusRuntimeStatic);
    assert.equal(value, 1);
});

test('static HTML is copied and Sass is compiled while its partial stays private', t => {
    const root = copyProject(t);
    for (const filename of ['index.html', '_palette.scss', 'site.scss']) {
        cpSync(join(root, 'cases/static-assets', filename), join(root, 'static', filename));
    }
    buildProject(root);
    const htmlPath = join(root, 'dist/index.html');
    const cssPath = join(root, 'dist/site.css');
    assert.equal(existsSync(htmlPath), true);
    assert.equal(existsSync(cssPath), true);
    assert.match(readFileSync(htmlPath, 'utf8'), /<rt-runtime-list><\/rt-runtime-list>/);
    assert.match(readFileSync(cssPath, 'utf8'), /#123456/);
    assert.equal(existsSync(join(root, 'dist/site.scss')), false);
    assert.equal(existsSync(join(root, 'dist/_palette.scss')), false);
    assert.equal(existsSync(join(root, 'dist/_palette.css')), false);
});

test('avoidParsingInsideTags preserves template syntax inside a configured tag', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/avoid-tag'), join(root, 'src/RuntimeAvoid'), { recursive: true });
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.avoidParsingInsideTags = ['av-code'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const element = document.createElement('rt-runtime-avoid');
        document.body.append(element);
        await new Promise(resolve => setTimeout(resolve, 0));
        const shadow = element.shadowRoot;
        const result = {
            raw: shadow.querySelector('av-code span')?.textContent.trim(),
            rawAttribute: shadow.querySelector('av-code span')?.getAttribute('@element'),
            outside: shadow.querySelector('.outside')?.textContent.trim(),
        };
        element.value = 'changed';
        await new Promise(resolve => setTimeout(resolve, 0));
        result.afterChange = {
            raw: shadow.querySelector('av-code span')?.textContent.trim(),
            outside: shadow.querySelector('.outside')?.textContent.trim(),
        };
        element.destructor();
        element.remove();
        return result;
    });
    assert.deepEqual(actual, {
        raw: '{{ this.value }}', rawAttribute: 'ignored', outside: 'filled',
        afterChange: { raw: '{{ this.value }}', outside: 'changed' },
    });
});

test('build avoidParsingInsideTags overrides the project tag list', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/avoid-tag'), join(root, 'src/RuntimeAvoid'), { recursive: true });
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.avoidParsingInsideTags = [];
    config.build[0].avoidParsingInsideTags = ['av-code'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => {
        const element = document.createElement('rt-runtime-avoid');
        document.body.append(element);
        const result = {
            raw: element.shadowRoot.querySelector('av-code span')?.textContent.trim(),
            outside: element.shadowRoot.querySelector('.outside')?.textContent.trim(),
        };
        element.destructor();
        element.remove();
        return result;
    });
    assert.deepEqual(actual, { raw: '{{ this.value }}', outside: 'filled' });
});

test('compiled i18n files provide global translations and locale switching', async t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].i18n.autoRegister = true;
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const translations = Object.fromEntries(['en-gb', 'fr-fr'].map(locale => [
        locale, JSON.parse(readFileSync(join(root, `dist/locales/${locale}.json`), 'utf8')),
    ]));
    assert.deepEqual(translations, {
        'en-gb': { hello: 'Hello', '{qty} items': '{qty} items', 'RuntimeReference°RuntimeMarkup°greeting': 'Hello component' },
        'fr-fr': { hello: 'Bonjour', '{qty} items': '{qty} articles', 'RuntimeReference°RuntimeMarkup°greeting': 'Bonjour composant' },
    });
    const browser = await chromium.launch();
    t.after(() => browser.close());
    const page = await browser.newPage();
    await page.route('https://example.test/**', route => {
        const pathname = new URL(route.request().url()).pathname;
        const locale = pathname.includes('/locales/fr-fr.json') ? 'fr-fr' :
            pathname.includes('/locales/en-gb.json') ? 'en-gb' : null;
        if (locale) return route.fulfill({
            status: 200, contentType: 'application/json',
            body: JSON.stringify(translations[locale]),
        });
        return route.fulfill({
            status: 200, contentType: 'text/html', body: '<!doctype html><html><body></body></html>',
        });
    });
    await page.goto('https://example.test/');
    await page.addScriptTag({ content: code });
    await page.waitForFunction(() => window.t?.('hello') === 'Hello');
    const actual = await page.evaluate(async () => {
        const loaderPresent = typeof Aventus.ResourceLoader === 'function';
        const english = [window.t('hello'), window.t('{qty} items', { qty: '5' })];
        const component = document.createElement('rt-runtime-markup');
        document.body.append(component);
        const componentEnglish = component.shadowRoot.querySelector('.translated').textContent.trim();
        await Aventus.I18n.setLocale('fr-fr');
        await new Promise(resolve => setTimeout(resolve, 0));
        const french = [window.t('hello'), window.t('{qty} items', { qty: '5' })];
        const componentFrench = component.shadowRoot.querySelector('.translated').textContent.trim();
        component.destructor();
        component.remove();
        return { loaderPresent, english, french, componentEnglish, componentFrench, locale: Aventus.I18n.getLocale() };
    });
    assert.deepEqual(actual, {
        loaderPresent: true, english: ['Hello', '5 items'], french: ['Bonjour', '5 articles'],
        componentEnglish: 'Hello component', componentFrench: 'Bonjour composant', locale: 'fr-fr',
    });
});

for (const [mode, expectedFiles] of [
    ['singleFile', ['en-gb.json', 'fr-fr.json']],
    ['oneToOne', ['messages_en-gb.json', 'messages_fr-fr.json', 'runtimemarkup_en-gb.json', 'runtimemarkup_fr-fr.json']],
    ['groupComponent', ['messages_en-gb.json', 'messages_fr-fr.json', '_components_en-gb.json', '_components_fr-fr.json']],
]) {
    test(`compiled i18n ${mode} output contains global and component translations`, t => {
        const root = copyProject(t);
        const configPath = join(root, 'aventus.conf.avt');
        const config = JSON.parse(readFileSync(configPath, 'utf8'));
        config.build[0].compile[0].i18n = [{ output: './dist/translations', mode, mount: '/translations' }];
        writeFileSync(configPath, JSON.stringify(config, null, 2));
        const { code } = buildProject(root);
        assert.ok(code.includes('RuntimeReference'));
        for (const name of expectedFiles) {
            const file = join(root, 'dist/translations', name);
            assert.equal(existsSync(file), true, `${mode}: ${name}`);
            const translations = JSON.parse(readFileSync(file, 'utf8'));
            if (name.includes('messages_')) assert.equal(translations.hello, name.includes('fr-fr') ? 'Bonjour' : 'Hello');
            if (name.includes('runtimemarkup_') || name.includes('_components_')) {
                assert.equal(translations['RuntimeReference°RuntimeMarkup°greeting'],
                    name.includes('fr-fr') ? 'Bonjour composant' : 'Hello component');
            }
            if (mode === 'singleFile') {
                assert.equal(translations.hello, name.includes('fr-fr') ? 'Bonjour' : 'Hello');
                assert.equal(translations['RuntimeReference°RuntimeMarkup°greeting'],
                    name.includes('fr-fr') ? 'Bonjour composant' : 'Hello component');
            }
        }
    });
}

test('an invalid first build reports a diagnostic without publishing an output', t => {
    const root = copyProject(t);
    const logic = join(root, 'src/RuntimeList/RuntimeList.wcl.avt');
    writeFileSync(logic, readFileSync(logic, 'utf8').replace('= "initial";', '= ;'));
    const result = runBuild(root);
    assert.equal(result.error, undefined, result.error?.message);
    const report = JSON.parse(result.stdout);
    assert.equal(report.success, false);
    assert.equal(report.builds['RuntimeReference@Main'].success, false);
    assert.match(JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics), /RuntimeList\.wcl\.avt/);
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
});

test('an invalid rebuild keeps the last valid output', t => {
    const root = copyProject(t);
    const output = join(root, 'dist/runtime-reference.js');
    const { code } = buildProject(root);
    const logic = join(root, 'src/RuntimeList/RuntimeList.wcl.avt');
    writeFileSync(logic, readFileSync(logic, 'utf8').replace('= "initial";', '= ;'));
    const result = runBuild(root);
    assert.equal(result.error, undefined, result.error?.message);
    const report = JSON.parse(result.stdout);
    assert.equal(report.success, false);
    assert.equal(report.builds['RuntimeReference@Main'].success, false);
    assert.match(JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics), /RuntimeList\.wcl\.avt/);
    assert.equal(readFileSync(output, 'utf8'), code);
});

test('rebuilding the reference project replaces view, logic and style in the generated bundle', t => {
    const root = copyProject(t);
    const directory = join(root, 'src/RuntimeList');
    const view = join(directory, 'RuntimeList.wcv.avt');
    const logic = join(directory, 'RuntimeList.wcl.avt');
    const style = join(directory, 'RuntimeList.wcs.avt');
    let { code } = buildProject(root);
    assert.match(code, /class="current"/);
    assert.match(code, /\["value"\] = "initial"/);
    assert.match(code, /display:block/);

    writeFileSync(view, readFileSync(view, 'utf8').replace('class="current"', 'class="revised"'));
    code = buildProject(root).code;
    assert.match(code, /class="revised"/);
    assert.doesNotMatch(code, /class="current"/);

    writeFileSync(logic, readFileSync(logic, 'utf8').replace('"initial"', '"revision-value"'));
    code = buildProject(root).code;
    assert.match(code, /\["value"\] = "revision-value"/);
    assert.doesNotMatch(code, /\["value"\] = "initial"/);

    writeFileSync(style, ':host { display: inline-block; }\n');
    code = buildProject(root).code;
    const listOutput = code.slice(code.indexOf('const RuntimeList ='), code.indexOf('RuntimeList.Namespace='));
    assert.match(listOutput, /display:inline-block/);
    assert.doesNotMatch(listOutput, /:host\{display:block\}/);
    assert.match(code, /class="revised"/);
    assert.match(code, /\["value"\] = "revision-value"/);
});

test('the compiled component renders its loop and updates its binding in a DOM', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tick = () => new Promise(resolve => setTimeout(resolve, 0));
        const component = document.createElement('rt-runtime-list');
        document.body.append(component);
        await tick();
        const shadow = component.shadowRoot;
        const rows = () => Array.from(shadow.querySelectorAll('li'), node => node.textContent.trim());
        const input = shadow.querySelector('input');
        const result = { hasShadow: !!shadow, initialRows: rows(), initialValue: input.value };
        component.value = 'updated';
        await tick();
        result.updatedValue = input.value;
        result.updatedText = shadow.querySelector('.current').textContent.trim();
        input.value = 'typed';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await tick();
        result.typedValue = component.value;
        component.items.push('gamma');
        await tick();
        result.addedRows = rows();
        component.items.splice(1, 1);
        await tick();
        result.removedRows = rows();
        input.value = 'changed';
        input.dispatchEvent(new Event('change', { bubbles: true }));
        result.changedValue = component.value;
        result.registered = Aventus.WebComponentInstance.getAllInstances(component.constructor).includes(component);
        component.remove();
        result.unregistered = !Aventus.WebComponentInstance.getAllInstances(component.constructor).includes(component);
        component.value = 'after removal';
        await tick();
        result.detachedValue = input.value;
        input.value = 'event after removal';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        result.valueAfterDetachedEvent = component.value;
        const retained = document.createElement('rt-runtime-list');
        document.body.append(retained);
        await tick();
        const retainedInput = retained.shadowRoot.querySelector('input');
        retained.remove(false);
        retained.value = 'still active';
        await tick();
        result.valueAfterRemoveWithoutDestruction = retainedInput.value;
        retained.destructor();
        return result;
    });
    assert.deepEqual(actual, {
        hasShadow: true, initialRows: ['alpha', 'beta'], initialValue: 'initial',
        updatedValue: 'updated', updatedText: 'updated', typedValue: 'typed',
        addedRows: ['alpha', 'beta', 'gamma'], removedRows: ['alpha', 'gamma'],
        changedValue: 'changed', registered: true, unregistered: true,
        detachedValue: 'changed', valueAfterDetachedEvent: 'after removal',
        valueAfterRemoveWithoutDestruction: 'still active',
    });
});

test('compiled for-of loop updates rows after reverse and unshift', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tick = () => new Promise(resolve => setTimeout(resolve, 0));
        const component = document.createElement('rt-runtime-list');
        document.body.append(component);
        const rows = () => Array.from(component.shadowRoot.querySelectorAll('li'), node => node.textContent.trim());
        await tick();
        component.items.reverse();
        await tick();
        const reversed = rows();
        component.items.unshift('first');
        await tick();
        const inserted = rows();
        const model = [...component.items];
        component.destructor();
        component.remove();
        return { reversed, inserted, model };
    });
    assert.deepEqual(actual, {
        reversed: ['beta', 'alpha'], inserted: ['first', 'beta', 'alpha'],
        model: ['first', 'beta', 'alpha'],
    });
});

test('compiled for-in loop follows object replacement and keeps its keys', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tick = () => new Promise(resolve => setTimeout(resolve, 0));
        const component = document.createElement('rt-runtime-branches');
        document.body.append(component);
        const rows = () => Array.from(component.shadowRoot.querySelectorAll('li'), node => node.textContent.trim());
        await tick();
        component.labels = { third: 'three', first: 'one' };
        await tick();
        const replaced = rows();
        component.labels.third = 'updated';
        await tick();
        const changed = rows();
        component.destructor();
        component.remove();
        return { replaced, changed };
    });
    assert.deepEqual(actual, {
        replaced: ['third: three', 'first: one'], changed: ['third: updated', 'first: one'],
    });
});

test('the compiled conditional and object loop respond to changes and a click', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tick = () => new Promise(resolve => setTimeout(resolve, 0));
        const component = document.createElement('rt-runtime-branches');
        document.body.append(component);
        await tick();
        const shadow = component.shadowRoot;
        const rows = () => Array.from(shadow.querySelectorAll('li'), node => node.textContent.trim());
        const result = {
            initialEven: shadow.querySelector('.even')?.textContent.trim(),
            initialOdd: shadow.querySelector('.odd')?.textContent.trim() ?? null,
            initialRows: rows(),
        };
        shadow.querySelector('button').click();
        await tick();
        result.count = component.count;
        result.nextEven = shadow.querySelector('.even')?.textContent.trim() ?? null;
        result.nextOdd = shadow.querySelector('.odd')?.textContent.trim();
        component.labels.third = 'three';
        await tick();
        result.addedRows = rows();
        delete component.labels.first;
        await tick();
        result.removedRows = rows();
        component.remove();
        return result;
    });
    assert.deepEqual(actual, {
        initialEven: 'Even 0', initialOdd: null, initialRows: ['first: one', 'second: two'],
        count: 1, nextEven: null, nextOdd: 'Odd 1',
        addedRows: ['first: one', 'second: two', 'third: three'],
        removedRows: ['second: two', 'third: three'],
    });
});

test('nested compiled conditions replace each branch as their guards change', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tick = () => new Promise(resolve => setTimeout(resolve, 0));
        const component = document.createElement('rt-runtime-branches');
        document.body.append(component);
        const shadow = component.shadowRoot;
        const visible = () => ['zero', 'positive-even', 'one', 'later-odd']
            .filter(name => shadow.querySelector('.' + name));
        await tick();
        const initial = visible();
        component.count = 1;
        await tick();
        const one = visible();
        component.count = 2;
        await tick();
        const two = visible();
        component.count = 3;
        await tick();
        const three = visible();
        component.destructor();
        component.count = 0;
        await tick();
        const afterDestruction = visible();
        component.remove();
        return { initial, one, two, three, afterDestruction };
    });
    assert.deepEqual(actual, {
        initial: ['zero'], one: ['one'], two: ['positive-even'], three: ['later-odd'],
        afterDestruction: [],
    });
});

test('compiled interpolation, view elements and event handlers work in a DOM', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tick = () => new Promise(resolve => setTimeout(resolve, 0));
        const component = document.createElement('rt-runtime-markup');
        document.body.append(component);
        await tick();
        const shadow = component.shadowRoot;
        const snapshot = () => ({
            selection: component.getSelection(),
            value: shadow.querySelector('input').value,
            injected: shadow.querySelector('.injected').value,
            optional: shadow.querySelector('.optional').textContent.trim(),
        });
        const initial = snapshot();
        component.label = 'Welcome';
        component.person.name = 'Lin';
        await tick();
        const updated = snapshot();
        component.optional = 'present';
        await tick();
        const optional = snapshot();
        shadow.querySelector('button').click();
        await tick();
        const clicked = snapshot();
        component.destructor();
        component.optional = 'after destruction';
        await tick();
        const destroyed = shadow.querySelector('.optional')?.textContent.trim() ?? null;
        component.remove();
        return { initial, updated, optional, clicked, destroyed };
    });
    assert.deepEqual(actual, {
        initial: { selection: { selected: 'Hello Ada', repeated: 2 }, value: 'Ada', injected: 'Ada', optional: '' },
        updated: { selection: { selected: 'Welcome Lin', repeated: 2 }, value: 'Lin', injected: 'Lin', optional: '' },
        optional: { selection: { selected: 'Welcome Lin', repeated: 2 }, value: 'Lin', injected: 'Lin', optional: 'present' },
        clicked: { selection: { selected: 'Welcome Grace', repeated: 2 }, value: 'Grace', injected: 'Grace', optional: 'present' },
        destroyed: null,
    });
});

test('compiled @ViewElement useLive follows a replaced shadow DOM node', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const component = document.createElement('rt-runtime-markup');
        document.body.append(component);
        await new Promise(resolve => component.onReady(resolve));
        const initial = component.getLiveSelection();
        const replacement = document.createElement('p');
        replacement.textContent = 'replacement';
        const source = [...component.shadowRoot.querySelectorAll('p')].find(node => node.textContent === 'live');
        replacement.setAttribute('_id', source?.getAttribute('_id'));
        source?.replaceWith(replacement);
        const updated = component.getLiveSelection();
        const found = !!source;
        component.remove();
        return { initial, updated, found };
    });
    assert.deepEqual(actual, { initial: 'live', updated: 'replacement', found: true });
});

test('compiled custom binding synchronizes a child property and callback in both directions', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tick = () => new Promise(resolve => setTimeout(resolve, 0));
        const parent = document.createElement('rt-runtime-binding');
        document.body.append(parent);
        await tick();
        const child = parent.shadowRoot.querySelector('rt-runtime-input');
        const input = child.shadowRoot.querySelector('input');
        const native = parent.shadowRoot.querySelector('input.native');
        const text = () => parent.shadowRoot.querySelector('p').textContent.trim();
        const initial = { parent: parent.value, child: child.val, input: input.value, text: text(), notifications: parent.notifications, native: native.value };
        parent.value = 'from parent';
        await tick();
        const pushed = { child: child.val, input: input.value, text: text() };
        input.value = 'from child';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await tick();
        const pulled = { parent: parent.value, child: child.val, text: text(), notifications: parent.notifications };
        native.value = 'typed native';
        native.dispatchEvent(new Event('input', { bubbles: true }));
        await tick();
        const beforeKeyup = parent.nativeValue;
        native.dispatchEvent(new Event('keyup', { bubbles: true }));
        await tick();
        const afterKeyup = parent.nativeValue;
        parent.destructor();
        child.val = 'after destruction';
        child.onNewVal.trigger();
        await tick();
        native.value = 'after destruction';
        native.dispatchEvent(new Event('keyup', { bubbles: true }));
        const destroyed = { parent: parent.value, native: parent.nativeValue, notifications: parent.notifications };
        parent.remove();
        return { initial, pushed, pulled, beforeKeyup, afterKeyup, destroyed };
    });
    assert.deepEqual(actual, {
        initial: { parent: 'binding seed', child: 'binding seed', input: 'binding seed', text: 'binding seed', notifications: 0, native: 'native seed' },
        pushed: { child: 'from parent', input: 'from parent', text: 'from parent' },
        pulled: { parent: 'from child', child: 'from child', text: 'from child', notifications: 1 },
        beforeKeyup: 'native seed', afterKeyup: 'typed native',
        destroyed: { parent: 'from child', native: 'typed native', notifications: 1 },
    });
});

test('compiled typed attributes and a property callback reflect changes', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tick = () => new Promise(resolve => setTimeout(resolve, 0));
        const component = document.createElement('rt-runtime-attributes');
        document.body.append(component);
        await tick();
        const snapshot = () => ({
            active: component.active, activeAttribute: component.hasAttribute('active'),
            count: component.count, countAttribute: component.getAttribute('count'),
            label: component.label, text: component.shadowRoot.querySelector('p').textContent.trim(),
            changes: component.changes,
        });
        const initial = snapshot();
        component.active = true;
        component.count = 7;
        component.label = 'from field';
        await tick();
        const fields = snapshot();
        component.removeAttribute('active');
        component.setAttribute('count', '12');
        component.setAttribute('label', 'from attribute');
        await tick();
        const attributes = snapshot();
        component.remove();
        return { initial, fields, attributes };
    });
    assert.deepEqual(actual, {
        initial: { active: false, activeAttribute: false, count: 2, countAttribute: '2', label: 'start', text: 'start', changes: 1 },
        fields: { active: true, activeAttribute: true, count: 7, countAttribute: '7', label: 'from field', text: 'from field', changes: 2 },
        attributes: { active: false, activeAttribute: false, count: 12, countAttribute: '12', label: 'from attribute', text: 'from attribute', changes: 3 },
    });
});

test('compiled literal, Date, DateTime and Time attributes round-trip through HTML', async t => {
    const root = copyProject(t);
    for (const extension of ['wcl', 'wcv']) {
        cpSync(join(root, `cases/attribute-types/RuntimeAttributeTypes.${extension}.avt`),
            join(root, `src/RuntimeAttributeTypes.${extension}.avt`));
    }
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeAttributeTypes.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const build = runBuild(root);
    assert.equal(build.status, 0, build.stdout || build.stderr);
    const code = readFileSync(join(root, 'dist/runtime-reference.js'), 'utf8');
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => {
        const element = new RuntimeReference.RuntimeAttributeTypes();
        document.body.append(element);
        element.setAttribute('caption', 'updated');
        element.mode = 'expanded';
        element.setAttribute('day', '2024-03-02');
        element.setAttribute('moment', '2024-03-02T09:15:00');
        element.setAttribute('hour', '09:15:00');
        element.setAttribute('selectedday', '2024-03-03');
        const result = {
            caption: element.caption,
            mode: element.mode, modeAttr: element.getAttribute('mode'),
            day: element.day?.toString(), dayType: element.day instanceof Aventus.Date,
            moment: element.moment?.toString(), momentType: element.moment instanceof Aventus.DateTime,
            hour: element.hour?.toString(), hourType: element.hour instanceof Aventus.Time,
            selectedDay: element.selectedday?.toString(), selectedDayType: element.selectedday instanceof Aventus.Date,
        };
        element.remove();
        return result;
    });
    assert.deepEqual(actual, {
        caption: 'updated', mode: 'expanded', modeAttr: 'expanded', day: '2024-03-02', dayType: true,
        moment: '2024-03-02T09:15:00', momentType: true,
        hour: '09:15:00', hourType: true,
        selectedDay: '2024-03-03', selectedDayType: true,
    });
});

test('a decorated property with uppercase letters reports the attribute naming diagnostic', t => {
    const root = copyProject(t);
    const source = join(root, 'cases/attribute-types/RuntimeAttributeTypes.wcl.avt');
    const target = join(root, 'src/RuntimeAttributeTypes.wcl.avt');
    writeFileSync(target, readFileSync(source, 'utf8').replace('selectedday', 'selectedDay'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeAttributeTypes.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const build = runBuild(root);
    assert.equal(build.error, undefined, build.error?.message);
    const report = JSON.parse(build.stdout);
    assert.equal(report.success, false);
    assert.match(JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics), /An attribute must be in lower case/);
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
});

test('an object-valued Attribute reports its unsupported type', t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/attribute-types/RuntimeInvalidAttribute.wcl.avt'),
        join(root, 'src/RuntimeInvalidAttribute.wcl.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeInvalidAttribute.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const build = runBuild(root);
    assert.equal(build.error, undefined, build.error?.message);
    const report = JSON.parse(build.stdout);
    assert.equal(report.success, false);
    assert.match(JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics), /as attribute \/ property/);
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
});

test('a single-file component compiles slots and lifecycle hooks', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tick = () => new Promise(resolve => setTimeout(resolve, 0));
        const component = document.createElement('rt-runtime-single');
        component.innerHTML = '<span>main</span><span slot="aside">side</span>';
        document.body.append(component);
        await new Promise(resolve => component.onReady(resolve));
        await tick();
        const slots = Array.from(component.shadowRoot.querySelectorAll('slot'), slot => ({
            name: slot.name, assigned: slot.assignedElements().map(element => element.textContent),
        }));
        const afterCreation = [...RuntimeReference.RuntimeSingle.lifecycle];
        component.destructor();
        const afterDestruction = [...RuntimeReference.RuntimeSingle.lifecycle];
        component.remove();
        return { slots, afterCreation, afterDestruction };
    });
    assert.deepEqual(actual, {
        slots: [{ name: '', assigned: ['main'] }, { name: 'aside', assigned: ['side'] }],
        afterCreation: ['created'], afterDestruction: ['created', 'destroyed'],
    });
});

test('compiled state decorators subscribe to transitions and unsubscribe on destruction', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const component = document.createElement('rt-runtime-state');
        document.body.append(component);
        await new Promise(resolve => component.onReady(resolve));
        const manager = RuntimeReference.RuntimeStateManager.getInstance();
        await manager.setState('/item/7');
        const active = [...component.events];
        await manager.setState('/');
        const inactive = [...component.events];
        component.destructor();
        await manager.setState('/item/8');
        const destroyed = [...component.events];
        component.remove();
        return { active, inactive, destroyed };
    });
    assert.deepEqual(actual, {
        active: ['default-inactive', 'active:7'],
        inactive: ['default-inactive', 'active:7', 'ask:7', 'inactive:7', 'default-active'],
        destroyed: ['default-inactive', 'active:7', 'ask:7', 'inactive:7', 'default-active'],
    });
});

test('compiled StateManager accepts string, State instance and static activation with subscriptions', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeStateCases.inspect());
    assert.deepEqual(actual, {
        stringApplied: true, stringType: 'EmptyState', denied: false,
        afterDenied: '/user/2', objectApplied: true, sameObject: true,
        staticApplied: true, afterStatic: '/user/4',
        events: ['active:2', 'ask:2>/user/3', 'ask:2>/person/create',
            'inactive:/person/create', 'active:4'],
    });
});

test('compiled Instance and Watcher APIs follow the documented singleton and reactivity behavior', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => ({
        instance: RuntimeReference.RuntimeCoreUtilities.inspectInstance(),
        watcher: RuntimeReference.RuntimeCoreUtilities.inspectWatcher(),
        resourceLoaderType: RuntimeReference.RuntimeCoreUtilities.resourceLoaderType(),
    }));
    assert.deepEqual(actual, {
        instance: { same: true, value: 7 },
        watcher: { events: ['CREATED:name:John', 'UPDATED:name:Jane', 'DELETED:name:Jane'],
            effectValues: [1, 2], initialComputed: 2, nextComputed: 4 },
        resourceLoaderType: 'undefined',
    });
});

test('compiled NoType and Deprecated metadata retain initialized values and methods', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => {
        const instance = new RuntimeReference.RuntimeDecoratorMetadata();
        return { legacy: instance.legacy(), current: instance.current(), details: instance.details };
    });
    assert.deepEqual(actual, { legacy: 4, current: 4, details: { value: 3 } });
    const sourcePath = join(root, 'src/RuntimeDecoratorMetadata.lib.avt');
    writeFileSync(sourcePath, readFileSync(sourcePath, 'utf8').replace('    @NoType()\n', ''));
    const result = runBuild(root);
    assert.equal(result.error, undefined, result.error?.message);
    const report = JSON.parse(result.stdout);
    assert.equal(report.success, false);
    assert.match(JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics),
        /You must define a type for the prop details/);
});

test('compiled NoCompile omits a decorated WebComponent method', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/no-compile'), join(root, 'src/RuntimeNoCompile'), { recursive: true });
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeNoCompile/RuntimeNoCompile.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => {
        const element = document.createElement(RuntimeReference.RuntimeNoCompile.Tag);
        return { omitted: typeof element.omitted, visible: element.visibleMethod() };
    });
    assert.deepEqual(actual, { omitted: 'undefined', visible: 4 });
});

test('an explicit ResourceLoader import compiles and caches fetched text', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/resource-loader-import/RuntimeImportedLoader.lib.avt'),
        join(root, 'src/RuntimeImportedLoader.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeImportedLoader.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const requests = [];
        window.fetch = async url => {
            requests.push(url);
            return new Response('sample content');
        };
        const result = await RuntimeReference.RuntimeImportedLoader.inspect();
        const observer = new MutationObserver(records => {
            for(const record of records) {
                for(const node of record.addedNodes) {
                    if(node instanceof HTMLLinkElement && node.getAttribute('href') === '/sample.css') {
                        queueMicrotask(() => node.dispatchEvent(new Event('load')));
                    }
                }
            }
        });
        observer.observe(document.head, { childList: true });
        const css = await RuntimeReference.RuntimeImportedLoader.loadCss();
        observer.disconnect();
        return { ...result, requests, css,
            stylesheets: document.head.querySelectorAll('link[href="/sample.css"]').length };
    });
    assert.deepEqual(actual, {
        available: 'function', first: 'sample content', second: 'sample content',
        requests: ['/sample.txt'], css: { first: true, second: true }, stylesheets: 1,
    });
});

test('compiled component inheritance replaces a named slot block and preserves the rest', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tick = () => new Promise(resolve => setTimeout(resolve, 0));
        const component = document.createElement('rt-runtime-derived');
        component.innerHTML = '<em slot="highlight">important</em><i slot="keep">other</i>';
        document.body.append(component);
        await tick();
        const shadow = component.shadowRoot;
        const initial = {
            label: shadow.querySelector('p')?.textContent.trim(),
            replacements: shadow.querySelectorAll('.replacement').length,
            highlight: shadow.querySelector('slot[name="highlight"]')?.assignedElements().map(el => el.textContent),
            keep: shadow.querySelector('slot[name="keep"]')?.assignedElements().map(el => el.textContent),
            color: getComputedStyle(shadow.querySelector('.base')).color,
        };
        component.label = 'derived';
        await tick();
        const updated = shadow.querySelector('p')?.textContent.trim();
        component.destructor();
        component.remove();
        return { initial, updated };
    });
    assert.deepEqual(actual, {
        initial: { label: 'base', replacements: 1, highlight: ['important'], keep: ['other'], color: 'rgb(0, 0, 255)' },
        updated: 'derived',
    });
});

test('compiled abstract generic component delegates Watch changes to concrete subclasses', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        RuntimeReference.RuntimeTextFillable.changes = [];
        RuntimeReference.RuntimeNumberFillable.changes = [];
        const text = new RuntimeReference.RuntimeTextFillable();
        const number = new RuntimeReference.RuntimeNumberFillable();
        const callbacks = [];
        text.onChange.add(value => callbacks.push('text:' + value));
        number.onChange.add(value => callbacks.push('number:' + value));
        document.body.append(text, number);
        await new Promise(resolve => setTimeout(resolve, 0));
        text.value = 'hello';
        number.value = 7;
        const result = {
            textChanges: [...RuntimeReference.RuntimeTextFillable.changes], numberChanges: [...RuntimeReference.RuntimeNumberFillable.changes], callbacks,
            labels: [text.shadowRoot.querySelector('label')?.textContent, number.shadowRoot.querySelector('label')?.textContent],
        };
        text.remove();
        number.remove();
        return result;
    });
    assert.deepEqual(actual, {
        textChanges: ['hello'], numberChanges: [7], callbacks: ['text:hello', 'number:7'],
        labels: ['base', 'base'],
    });
});

test('compiled @OverrideView replaces the inherited template and retains inherited reactive properties', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const component = document.createElement('rt-runtime-override');
        component.innerHTML = '<em slot="highlight">slotted</em>';
        document.body.append(component);
        await new Promise(resolve => component.onReady(resolve));
        const shadow = component.shadowRoot;
        const initial = {
            base: shadow.querySelectorAll('.base').length,
            override: shadow.querySelectorAll('.override').length,
            label: shadow.querySelector('span')?.textContent.trim(),
            slot: shadow.querySelector('slot[name="highlight"]')?.assignedElements().map(el => el.textContent),
        };
        component.label = 'changed';
        await new Promise(resolve => setTimeout(resolve, 0));
        const updated = shadow.querySelector('span')?.textContent.trim();
        component.destructor();
        component.remove();
        return { initial, updated };
    });
    assert.deepEqual(actual, {
        initial: { base: 0, override: 1, label: 'base', slot: ['slotted'] },
        updated: 'changed',
    });
});

test('compiled external component style and host custom property affect computed CSS', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const theme = join(root, 'dist/theme.css');
    assert.equal(existsSync(theme), true);
    assert.match(readFileSync(theme, 'utf8'), /--runtime-theme-color/);
    const page = await openCompiledPage(t, code);
    await page.addStyleTag({ content: readFileSync(theme, 'utf8') });
    const actual = await page.evaluate(async () => {
        const component = document.createElement('rt-runtime-styled');
        document.body.append(component);
        await new Promise(resolve => component.onReady(resolve));
        const paragraph = component.shadowRoot.querySelector('p');
        const initial = {
            color: getComputedStyle(paragraph).color,
            background: getComputedStyle(paragraph).backgroundColor,
            theme: getComputedStyle(component.shadowRoot.querySelector('.theme')).borderColor,
        };
        component.style.setProperty('--runtime-styled-background', 'rgb(0, 128, 0)');
        const changed = getComputedStyle(paragraph).backgroundColor;
        component.destructor();
        component.remove();
        return { initial, changed };
    });
    assert.deepEqual(actual, {
        initial: { color: 'rgb(255, 0, 0)', background: 'rgb(0, 0, 255)', theme: 'rgb(128, 0, 128)' },
        changed: 'rgb(0, 128, 0)',
    });
});

test('TagName registers the compiled component under its explicit custom element name', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => {
        const registered = customElements.get('rt-custom-name') === RuntimeReference.RuntimeNamed;
        const component = document.createElement('rt-custom-name');
        document.body.append(component);
        const text = component.shadowRoot.querySelector('p')?.textContent.trim();
        component.destructor();
        component.remove();
        return { registered, text };
    });
    assert.deepEqual(actual, { registered: true, text: 'named component' });
});

test('compiled calendar classes parse, compare, and format dates, times, and offset instants', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeCalendar.inspect());
    assert.deepEqual(actual, {
        date: '2024-02-29', next: '2024-03-01', before: true, invalidDate: true,
        time: '00:30:00', instant: '2024-02-29T11:30:00Z', kind: 'utc',
    });
});

test('compiled Converter applies calendar schemas to Date, DateTime, and Time fields', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeCalendar.convert());
    assert.deepEqual(actual, {
        typed: true, day: '2024-02-29', moment: '2024-02-29T11:30:00Z', time: '23:30:00',
    });
});

test('compiled calendar boundaries, zone conversion, distances, and invalid input', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeCalendar.boundaries());
    assert.deepEqual(actual, {
        monthStart: '2024-02-01', monthEnd: '2024-02-29', weekStart: '2024-02-26',
        daysUntil: 2, diffDays: 2, utc: '2024-02-29T11:30:00Z', utcKind: 'utc',
        timeBefore: true, invalidTime: true, invalidDateTime: true,
    });
});

test('compiled Data metadata and Convertible registration restore typed objects', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => {
        const { RuntimePerson, RuntimeConvertible } = RuntimeReference;
        const person = new RuntimePerson();
        person.id = 4;
        person.name = 'Ada';
        const clone = person.clone();
        const restored = Aventus.Converter.transform({
            $type: RuntimePerson.Fullname, id: '7', name: 42, active: 1,
        });
        const custom = Aventus.Converter.transform({
            $type: RuntimeConvertible.Fullname, value: 'hello',
        });
        return {
            fullname: RuntimePerson.Fullname,
            type: person.$type,
            schema: RuntimePerson.$schema,
            json: JSON.parse(JSON.stringify(person)),
            clone: { typed: clone instanceof RuntimePerson, equal: clone.name === person.name, distinct: clone !== person },
            restored: { typed: restored instanceof RuntimePerson, id: restored.id, name: restored.name, active: restored.active },
            custom: { typed: custom instanceof RuntimeConvertible, value: custom.value },
        };
    });
    assert.deepEqual(actual, {
        fullname: 'RuntimeReference.RuntimePerson', type: 'RuntimeReference.RuntimePerson',
        schema: { namespace: 'string', $type: 'string', className: 'string', id: 'number', name: 'string', active: 'boolean' },
        json: { id: 4, name: 'Ada', active: false, $type: 'RuntimeReference.RuntimePerson' },
        clone: { typed: true, equal: true, distinct: true },
        restored: { typed: true, id: 7, name: '42', active: true },
        custom: { typed: true, value: 'hello' },
    });
});

test('@ForeignKey emits a reference schema for a compiled Data class', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => ({
        schema: RuntimeReference.RuntimeForeignKey.$schema,
        value: new RuntimeReference.RuntimeForeignKey().personId,
    }));
    assert.equal(actual.schema.personId, 'ref:RuntimeReference.RuntimePerson');
    assert.equal(actual.value, 0);
});

test('@Effect reads an initialized Signal and reacts to changes', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        RuntimeReference.RuntimeEffect.runs = [];
        const element = new RuntimeReference.RuntimeEffect();
        await Promise.resolve();
        const initial = [...RuntimeReference.RuntimeEffect.runs];
        element.count = 2;
        await Promise.resolve();
        const changed = [...RuntimeReference.RuntimeEffect.runs];
        element.destructor();
        return { initial, changed };
    });
    assert.deepEqual(actual, { initial: [1], changed: [1, 2] });
});

test('@Effect without a Signal runs once when the compiled component is created', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    assert.equal(await page.evaluate(async () => {
        RuntimeReference.RuntimeEffectPlain.runs = 0;
        const element = new RuntimeReference.RuntimeEffectPlain();
        await Promise.resolve();
        const runs = RuntimeReference.RuntimeEffectPlain.runs;
        element.destructor();
        return runs;
    }), 1);
    assert.equal(await page.evaluate(async () => {
        RuntimeReference.RuntimeEffectPlain.runs = 0;
        const element = new RuntimeReference.RuntimeEffectPlain();
        element.destructor();
        await Promise.resolve();
        return RuntimeReference.RuntimeEffectPlain.runs;
    }), 0);
});

test('@InternalProtected narrows package declarations while retaining executable members', async t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].package = './dist/RuntimeReference@Main.package.avt';
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const packageText = readFileSync(join(root, 'dist/RuntimeReference@Main.package.avt'), 'utf8');
    assert.match(packageText, /protected value: number/);
    assert.match(packageText, /protected double\(\): number/);
    const page = await openCompiledPage(t, code);
    assert.equal(await page.evaluate(() => new RuntimeReference.RuntimeInternalProtected().read()), 6);
});

test('compiled object utilities and Json follow nested paths and conversion rules', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeTools.inspect());
    assert.deepEqual(actual, {
        reorderedDefault: false,
        reorderedIgnoringOrder: true,
        arrayIgnoringOrder: true,
        changed: false,
        city: 'New York',
        missing: true,
        json: { name: 'Ada', age: 30 },
        restored: { name: 'Ada', age: 30 },
    });
});

test('compiled Mutex serializes concurrent async work', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeTools.mutexOrder());
    assert.deepEqual(actual, ['start:1', 'end:1', 'start:2', 'end:2', 'start:3', 'end:3']);
});

test('compiled utility bundle includes uuidv4 and sleep functions', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeTools.utilityAvailability());
    assert.deepEqual(actual, { uuidAvailable: true, sleepAvailable: true });
});

test('compiled alias import resolves a root library function and enum', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeAlias.inspect());
    assert.equal(actual, 'ALIAS:2');
});

test('build compile.input emits only the selected library and its dependencies', async t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeAlias.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    assert.match(code, /RuntimeAlias/);
    assert.match(code, /runtimeUpper/);
    assert.doesNotMatch(code, /RuntimeList/);
    const page = await openCompiledPage(t, code);
    const value = await page.evaluate(() => RuntimeReference.RuntimeAlias.inspect());
    assert.equal(value, 'ALIAS:2');
});

test('build compressed output remains executable and is smaller than plain output', async t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeAlias.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const plain = buildProject(root).code;
    config.build[0].compile[0].compressed = true;
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const compressed = buildProject(root).code;
    assert.ok(compressed.length < plain.length, `${compressed.length} >= ${plain.length}`);
    const page = await openCompiledPage(t, compressed);
    const value = await page.evaluate(() => RuntimeReference.RuntimeAlias.inspect());
    assert.equal(value, 'ALIAS:2');
});

test('build writes each configured JavaScript output path with executable content', async t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeFunction.lib.avt'];
    config.build[0].compile[0].output = ['./dist/runtime-reference.js', './dist/runtime-copy.js'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const copy = readFileSync(join(root, 'dist/runtime-copy.js'), 'utf8');
    assert.equal(copy, code);
    const page = await openCompiledPage(t, copy);
    assert.equal(await page.evaluate(() => RuntimeReference.runtimeUpper('copy')), 'COPY');
});

test('build writes each configured package path with the same declarations', t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeFunction.lib.avt'];
    config.build[0].compile[0].package = [
        './dist/RuntimeReference@Main.package.avt', './dist/RuntimeReferenceCopy@Main.package.avt',
    ];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    buildProject(root);
    const first = readFileSync(join(root, 'dist/RuntimeReference@Main.package.avt'), 'utf8');
    const second = readFileSync(join(root, 'dist/RuntimeReferenceCopy@Main.package.avt'), 'utf8');
    assert.equal(second, first);
    assert.match(first, /runtimeUpper/);
});

test('build writes an npm module to each configured outputNpm path', async t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeFunction.lib.avt'];
    config.build[0].compile[0].outputNpm = {
        path: ['./npm-primary', './npm-copy'], packageJson: true, live: true,
    };
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    buildProject(root);
    for (const directory of ['npm-primary', 'npm-copy']) {
        const modulePath = join(root, directory, 'index.js');
        assert.equal(existsSync(modulePath), true);
        const module = await import(pathToFileURL(modulePath).href);
        assert.equal(module.RuntimeReference.runtimeUpper(directory), directory.toUpperCase());
    }
});

test('a static file uses its adjacent defnpm declarations in npm output', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/static-npm/RuntimeStatic.defnpm.avt'),
        join(root, 'src/RuntimeStatic.defnpm.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeStatic.static.avt'];
    config.build[0].compile[0].outputNpm = { path: './npm-static', packageJson: true, live: true };
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    assert.equal(await page.evaluate(() => globalThis.__aventusRuntimeStatic), 1);
    const declarations = readFileSync(join(root, 'npm-static/index.d.ts'), 'utf8');
    assert.match(declarations, /__aventusNpmDeclarationMarker/);
});

test('a static file falls back to its adjacent def declarations for npm output', async t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeStatic.static.avt'];
    config.build[0].compile[0].outputNpm = { path: './npm-static', packageJson: true, live: true };
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    assert.equal(await page.evaluate(() => globalThis.__aventusRuntimeStatic), 1);
    const declarations = readFileSync(join(root, 'npm-static/index.d.ts'), 'utf8');
    assert.match(declarations, /__aventusRuntimeStatic: number/);
    assert.doesNotMatch(declarations, /__aventusNpmDeclarationMarker/);
});

test('build outsideModule emits exports after their registration scope has closed', async t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeFunction.lib.avt'];
    config.build[0].outsideModule = ['./src/RuntimeFunction.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    assert.match(code, /\}\)\(RuntimeReference\);\s*let runtimeNumber=/);
    assert.match(code, /__as1\(_, 'runtimeNumber', runtimeNumber\)/);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => ({
        global: typeof window.runtimeUpper,
        value: window.runtimeUpper?.('outside'),
        nested: typeof RuntimeReference?.runtimeUpper,
    }));
    assert.deepEqual(actual, { global: 'undefined', value: undefined, nested: 'undefined' });
});

test('disabled build does not emit its JavaScript output', t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].disabled = true;
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const result = runBuild(root);
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.success, true);
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
});

test('build package output contains declarations and source metadata for selected exports', t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeAlias.lib.avt'];
    config.build[0].compile[0].package = './dist/RuntimeReference@Main.package.avt';
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    buildProject(root);
    const packagePath = join(root, 'dist/RuntimeReference@Main.package.avt');
    assert.equal(existsSync(packagePath), true);
    const packageText = readFileSync(packagePath, 'utf8');
    assert.match(packageText, /RuntimeReference@Main/);
    assert.match(packageText, /#region js def/);
    assert.match(packageText, /RuntimeAlias/);
    assert.match(packageText, /#region js src/);
    assert.doesNotMatch(packageText, /RuntimeList/);
});

test('a locally generated package dependency allows a second project build', t => {
    const producer = copyProject(t);
    const producerConfigPath = join(producer, 'aventus.conf.avt');
    const producerConfig = JSON.parse(readFileSync(producerConfigPath, 'utf8'));
    producerConfig.build[0].compile[0].input = ['./src/RuntimeFunction.lib.avt'];
    producerConfig.build[0].compile[0].package = './dist/RuntimeReference@Main.package.avt';
    writeFileSync(producerConfigPath, JSON.stringify(producerConfig, null, 2));
    buildProject(producer);
    const packagePath = join(producer, 'dist/RuntimeReference@Main.package.avt');
    assert.equal(existsSync(packagePath), true);

    const consumer = copyProject(t);
    cpSync(join(producer, 'dist'), join(consumer, 'packages'), { recursive: true });
    const consumerConfigPath = join(consumer, 'aventus.conf.avt');
    const consumerConfig = JSON.parse(readFileSync(consumerConfigPath, 'utf8'));
    consumerConfig.module = 'PackageConsumer';
    consumerConfig.build[0].module = 'PackageConsumer';
    consumerConfig.build[0].compile[0].input = ['./src/RuntimeFunction.lib.avt'];
    writeFileSync(consumerConfigPath, JSON.stringify(consumerConfig, null, 2));
    const baseline = runBuild(consumer);
    assert.equal(baseline.error, undefined, baseline.error?.message);
    assert.equal(JSON.parse(baseline.stdout).builds['PackageConsumer@Main']?.success, true, baseline.stdout);

    consumerConfig.dependencies = { 'RuntimeReference@Main': { uri: './packages/RuntimeReference@Main.package.avt' } };
    writeFileSync(consumerConfigPath, JSON.stringify(consumerConfig, null, 2));
    const result = runBuild(consumer);
    assert.equal(result.error, undefined, result.error?.message);
    const report = JSON.parse(result.stdout);
    assert.equal(report.success, true, result.stdout);
    assert.equal(report.builds['PackageConsumer@Main']?.success, true, result.stdout);
    assert.equal(existsSync(join(consumer, 'dist/runtime-reference.js')), true);

    consumerConfig.build[0].compile[0].input = ['./src/RuntimeLocalPackage.lib.avt'];
    cpSync(join(consumer, 'cases/local-package/RuntimeLocalPackage.lib.avt'),
        join(consumer, 'src/RuntimeLocalPackage.lib.avt'));
    writeFileSync(consumerConfigPath, JSON.stringify(consumerConfig, null, 2));
    const imported = runBuild(consumer);
    assert.equal(imported.error, undefined, imported.error?.message);
    const importedReport = JSON.parse(imported.stdout);
    assert.equal(importedReport.success, true);
    assert.equal(importedReport.builds['PackageConsumer@Main']?.success, true, imported.stdout);
    assert.equal(existsSync(join(consumer, 'dist/runtime-reference.js')), true);
});

test('a configured Aventus UI package import compiles and registers its required component', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiDependency.lib.avt'),
        join(root, 'src/RuntimeUiDependency.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiDependency.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const actual = await page.evaluate(async () => {
        const tag = RuntimeReference.RuntimeUiDependency.getTag();
        const element = document.createElement(tag);
        element.value = 35;
        element.stroke_width = 8;
        document.body.append(element);
        await new Promise(resolve => setTimeout(resolve, 0));
        const result = {
            importedTag: tag,
            registered: typeof customElements.get(tag),
            value: element.value,
            strokeWidth: element.stroke_width,
            svg: !!element.shadowRoot.querySelector('svg'),
        };
        element.destructor();
        element.remove();
        return result;
    });
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(actual, {
        importedTag: 'av-progress-circle', registered: 'function',
        value: 35, strokeWidth: 8, svg: true,
    });
});

test('the compiled UI Collapse toggles its open attribute from header presses', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiCollapse.lib.avt'),
        join(root, 'src/RuntimeUiCollapse.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiCollapse.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tick = () => new Promise(resolve => setTimeout(resolve, 0));
        const tag = RuntimeReference.RuntimeUiCollapse.getTag();
        const element = document.createElement(tag);
        element.innerHTML = '<div slot="header">Toggle</div><p>Details</p>';
        document.body.append(element);
        await tick();
        const initial = { open: element.open, attribute: element.hasAttribute('open') };
        const title = element.shadowRoot.querySelector('.title');
        title.dispatchEvent(new PointerEvent('pointerdown', {
            bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0,
        }));
        document.dispatchEvent(new PointerEvent('pointerup', {
            bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0,
        }));
        await tick();
        const firstPress = { open: element.open, attribute: element.hasAttribute('open') };
        title.dispatchEvent(new PointerEvent('pointerdown', {
            bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0,
        }));
        document.dispatchEvent(new PointerEvent('pointerup', {
            bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0,
        }));
        await tick();
        const secondPress = { open: element.open, attribute: element.hasAttribute('open') };
        element.destructor();
        element.remove();
        return { tag, initial, firstPress, secondPress };
    });
    assert.deepEqual(actual, {
        tag: 'av-collapse',
        initial: { open: false, attribute: false },
        firstPress: { open: true, attribute: true },
        secondPress: { open: false, attribute: false },
    });
});

test('compiled UI FormHandler validates required email values and resets the model', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiForm.lib.avt'),
        join(root, 'src/RuntimeUiForm.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiForm.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeUiForm.inspect());
    assert.deepEqual(actual, {
        directRequired: 'Le champs email est requis', directEmail: 'Please enter a valid email address',
        empty: false, invalid: false, invalidWithListener: false, invalidWithEmptyListener: false, valid: true,
        firstReset: { email: '', profile: 'start' },
        resetEmail: '', resetProfile: 'start', defaultEmail: '', defaultProfile: 'start',
    });
});

test('compiled UI navigation link tracks its active route', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiNavigation.lib.avt'),
        join(root, 'src/RuntimeUiNavigation.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiNavigation.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const actual = await page.evaluate(async () => {
        const tag = RuntimeReference.RuntimeUiNavigation.getTag();
        const link = document.createElement(tag);
        link.setAttribute('to', '/home');
        link.textContent = 'Home';
        document.body.append(link);
        await new Promise(resolve => setTimeout(resolve, 120));
        const initial = link.classList.contains('active');
        const navigated = await RuntimeReference.RuntimeUiNavigation.navigate('/home');
        await new Promise(resolve => setTimeout(resolve, 30));
        const active = link.classList.contains('active');
        const anchor = link.shadowRoot.querySelector('a');
        const shadow = { href: anchor?.getAttribute('href'), hasSlot: !!anchor?.querySelector('slot') };
        link.destructor();
        link.remove();
        return { tag, registered: typeof customElements.get(tag), initial, navigated, active,
            currentState: RuntimeReference.RuntimeUiNavigation.currentState(), shadow };
    });
    assert.deepEqual({ ...actual, errors: pageErrors }, {
        tag: 'av-link', registered: 'function', initial: false,
        navigated: true, currentState: '/home', active: true,
        shadow: { href: '/home', hasSlot: true }, errors: [],
    });
});

test('compiled UI Process extracts success and dispatches errors to its configured handler', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiProcess.lib.avt'),
        join(root, 'src/RuntimeUiProcess.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiProcess.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeUiProcess.inspect());
    assert.deepEqual(actual, { value: 'done', missing: undefined, messages: ['Bad request'] });
});

test('compiled UI ToastManager displays a configured toast and closes it', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-toast'), join(root, 'src/RuntimeUiToast'), { recursive: true });
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiToastController.lib.avt'),
        join(root, 'src/RuntimeUiToastController.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiToastController.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        RuntimeReference.RuntimeUiToastController.configure();
        const completion = RuntimeReference.RuntimeUiToastController.add('Hello toast');
        await new Promise(resolve => setTimeout(resolve, 0));
        const toast = document.querySelector('rt-runtime-ui-toast');
        const shown = { found: !!toast, message: toast?.shadowRoot.querySelector('p')?.textContent.trim() };
        await toast?.close();
        const added = await completion;
        const removed = !document.querySelector('rt-runtime-ui-toast');
        const autoClosed = await RuntimeReference.RuntimeUiToastController.add('Auto toast', 20);
        const removedAfterDelay = !document.querySelector('rt-runtime-ui-toast');
        document.querySelector('av-toast-manager')?.remove();
        return { added, shown, removed, autoClosed, removedAfterDelay };
    });
    assert.deepEqual(actual, {
        added: false, shown: { found: true, message: 'Hello toast' }, removed: true,
        autoClosed: false, removedAfterDelay: true,
    });
});

test('compiled UI ShortcutManager replaces and restores a Ctrl+S handler', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiShortcut.lib.avt'),
        join(root, 'src/RuntimeUiShortcut.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiShortcut.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const shortcuts = RuntimeReference.RuntimeUiShortcut;
        const press = async () => {
            document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', bubbles: true }));
            document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }));
            document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 's', ctrlKey: true, bubbles: true }));
            document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'Control', bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 0));
        };
        shortcuts.register();
        await press();
        shortcuts.replace();
        await press();
        shortcuts.restore();
        await press();
        shortcuts.dispose();
        await press();
        return [...shortcuts.events];
    });
    assert.deepEqual(actual, ['original', 'temporary', 'original']);
});

test('compiled UI ShortcutManager normalizes key order and honors conditional false', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiShortcut.lib.avt'),
        join(root, 'src/RuntimeUiShortcut.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiShortcut.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const shortcuts = RuntimeReference.RuntimeUiShortcut;
        shortcuts.events.length = 0;
        shortcuts.registerConditional();
        const press = async () => {
            document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', bubbles: true }));
            const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true, cancelable: true });
            document.body.dispatchEvent(event);
            await new Promise(resolve => setTimeout(resolve, 0));
            document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
            document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'Control', bubbles: true }));
            return event.defaultPrevented;
        };
        const ignoredPrevented = await press();
        shortcuts.conditionalEnabled = true;
        const acceptedPrevented = await press();
        shortcuts.disposeConditional();
        shortcuts.preventPrintOnly();
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', bubbles: true }));
        const print = new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, bubbles: true, cancelable: true });
        document.body.dispatchEvent(print);
        await new Promise(resolve => setTimeout(resolve, 0));
        document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'p', bubbles: true }));
        document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'Control', bubbles: true }));
        return { events: [...shortcuts.events], ignoredPrevented, acceptedPrevented, printPrevented: print.defaultPrevented };
    });
    assert.deepEqual(actual, {
        events: ['ignored', 'accepted'], ignoredPrevented: false, acceptedPrevented: true, printPrevented: true,
    });
});

test('compiled UI Img includes ResourceLoader and renders an inline SVG', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiImage.lib.avt'),
        join(root, 'src/RuntimeUiImage.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiImage.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const actual = await page.evaluate(async () => {
        const calls = [];
        const tag = RuntimeReference.RuntimeUiImage.getTag();
        const image = document.createElement(tag);
        image.mode = 'contains';
        image.style.setProperty('--img-fill-color', 'rgb(255, 0, 0)');
        document.body.append(image);
        await new Promise(resolve => setTimeout(resolve, 0));
        const missingLoader = typeof Aventus.ResourceLoader;
        Aventus.ResourceLoader = { load: async url => {
            calls.push(url);
            return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>';
        } };
        image.src = '/loaded.svg';
        await new Promise(resolve => setTimeout(resolve, 50));
        const result = {
            tag, calls, circle: !!image.shadowRoot.querySelector('svg circle'), mode: image.mode,
            src: image.src, missingLoader,
            fill: getComputedStyle(image.shadowRoot.querySelector('svg')).fill,
        };
        image.destructor();
        image.remove();
        return result;
    });
    assert.deepEqual({ ...actual, pageErrors }, {
        tag: 'av-img', calls: ['/loaded.svg'], circle: true, mode: 'contains',
        src: '/loaded.svg', missingLoader: 'function',
        fill: 'rgb(255, 0, 0)',
        pageErrors: [],
    });
});

test('compiled UI Img switches raster mode and uses ResourceLoader for cached images', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiImage.lib.avt'),
        join(root, 'src/RuntimeUiImage.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiImage.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const actual = await page.evaluate(async () => {
        const calls = [];
        Aventus.ResourceLoader = { load: async request => {
            calls.push(request);
            return 'data:image/png;base64,AA==';
        } };
        Aventus.ResizeObserver = class { observe() {} disconnect() {} };
        const image = document.createElement(RuntimeReference.RuntimeUiImage.getTag());
        document.body.append(image);
        image.mode = 'cover';
        image.src = '/plain.png';
        await new Promise(resolve => setTimeout(resolve, 120));
        const plain = image.shadowRoot.querySelector('img')?.getAttribute('src');
        image.cache = true;
        image.mode = 'stretch';
        image.src = '/cached.png';
        await new Promise(resolve => setTimeout(resolve, 50));
        const result = {
            plain, cached: image.shadowRoot.querySelector('img')?.getAttribute('src'),
            mode: image.mode, cache: image.cache, calls,
        };
        image.destructor();
        image.remove();
        return result;
    });
    assert.deepEqual(actual, {
        plain: '/plain.png', cached: 'data:image/png;base64,AA==',
        mode: 'stretch', cache: true, calls: [{ url: '/cached.png', type: 'img' }],
    });
    assert.deepEqual(pageErrors, []);
});

test('compiled UI Img calculates distinct raster dimensions for each mode', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiImage.lib.avt'),
        join(root, 'src/RuntimeUiImage.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiImage.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        Aventus.ResizeObserver = class { observe() {} disconnect() {} };
        const image = document.createElement(RuntimeReference.RuntimeUiImage.getTag());
        image.style.display = 'block';
        document.body.append(image);
        await new Promise(resolve => image.onReady(resolve));
        const inner = image.shadowRoot.querySelector('img');
        Object.defineProperties(image, {
            offsetWidth: { configurable: true, get: () => 200 },
            offsetHeight: { configurable: true, get: () => 100 },
        });
        Object.defineProperties(inner, {
            offsetWidth: { configurable: true, get: () => 80 },
            offsetHeight: { configurable: true, get: () => 80 },
        });
        image.src = '/raster.png';
        await new Promise(resolve => setTimeout(resolve, 150));
        const sizes = {};
        for (const mode of ['stretch', 'contains', 'cover']) {
            image.mode = mode;
            image.calculateSize();
            sizes[mode] = [inner.style.width, inner.style.height];
        }
        image.destructor();
        image.remove();
        return sizes;
    });
    assert.deepEqual(actual, {
        stretch: ['100%', '100%'], contains: ['100px', '100px'], cover: ['200px', '200px'],
    });
});

test('compiled UI Row supports programmatic creation while Col renders its size styles', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiGrid.lib.avt'),
        join(root, 'src/RuntimeUiGrid.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiGrid.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const actual = await page.evaluate(async () => {
        const tags = RuntimeReference.RuntimeUiGrid.tags();
        const row = document.createElement(tags.row);
        row.style.width = '600px';
        const first = document.createElement(tags.col);
        first.size = 6;
        first.textContent = 'A';
        const second = document.createElement(tags.col);
        second.size = 6;
        second.textContent = 'B';
        row.append(first, second);
        document.body.append(row);
        await new Promise(resolve => setTimeout(resolve, 120));
        const initial = {
            rowRegistered: typeof customElements.get(tags.row),
            colRegistered: typeof customElements.get(tags.col),
            rowDisplay: getComputedStyle(row).display,
            containerName: row.style.containerName,
            containerType: row.style.containerType,
            rowConstructor: row.constructor.name,
            rowShadow: !!row.shadowRoot?.querySelector('slot'),
            colConstructor: first.constructor.name,
            firstSize: first.getAttribute('size'),
            secondSize: second.getAttribute('size'),
        };
        second.size = 0;
        await new Promise(resolve => setTimeout(resolve, 0));
        const sizeZero = { display: getComputedStyle(second).display, width: getComputedStyle(second).width };
        const markup = document.createElement('div');
        markup.innerHTML = '<av-row style="width:600px"><av-col size="6">A</av-col><av-col size="6">B</av-col></av-row>';
        document.body.append(markup);
        await new Promise(resolve => setTimeout(resolve, 0));
        const parsedRow = markup.querySelector('av-row');
        const parsed = {
            constructor: parsedRow.constructor.name,
            display: getComputedStyle(parsedRow).display,
            widths: Array.from(parsedRow.querySelectorAll('av-col'), col => Math.round(col.getBoundingClientRect().width)),
        };
        first.destructor?.();
        second.destructor?.();
        row.destructor?.();
        row.remove();
        parsedRow.destructor?.();
        markup.remove();
        return { tags, initial, sizeZero, parsed };
    });
    assert.deepEqual({ ...actual, pageErrors }, {
        tags: { row: 'av-row', col: 'av-col' },
        initial: {
            rowRegistered: 'function', colRegistered: 'function', rowDisplay: 'flex',
            containerName: 'row', containerType: 'inline-size',
            rowConstructor: 'Row', rowShadow: true,
            colConstructor: 'Col', firstSize: '6', secondSize: '6',
        },
        sizeZero: { display: 'none', width: '0px' },
        parsed: { constructor: 'Row', display: 'flex', widths: [300, 300] },
        pageErrors: [],
    });
});

test('compiled UI Col responds to documented media breakpoints', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiGrid.lib.avt'),
        join(root, 'src/RuntimeUiGrid.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiGrid.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    await page.setViewportSize({ width: 400, height: 600 });
    await page.evaluate(() => {
        const row = document.createElement('div');
        row.style.width = '600px';
        row.innerHTML = '<av-col size_xs="12" size_md="6" size_lg="4">responsive</av-col>';
        document.body.append(row);
        globalThis.runtimeResponsiveCol = row.querySelector('av-col');
    });
    const widths = [];
    for (const width of [400, 800, 1000]) {
        await page.setViewportSize({ width, height: 600 });
        widths.push(await page.evaluate(() => Math.round(runtimeResponsiveCol.getBoundingClientRect().width)));
    }
    assert.deepEqual(widths, [600, 300, 200]);
});

test('compiled UI Col responds to container width when use_container is enabled', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiGrid.lib.avt'),
        join(root, 'src/RuntimeUiGrid.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiGrid.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    await page.setViewportSize({ width: 1200, height: 600 });
    const widths = await page.evaluate(async () => {
        const container = document.createElement('div');
        Object.assign(container.style, { width: '400px', containerName: 'row', containerType: 'inline-size' });
        container.innerHTML = '<av-col use_container size_xs="12" size_md="6" size_lg="4">responsive</av-col>';
        document.body.append(container);
        const column = container.querySelector('av-col');
        const result = [];
        for (const width of [400, 800, 1000]) {
            container.style.width = `${width}px`;
            await new Promise(resolve => requestAnimationFrame(resolve));
            result.push(Math.round(column.getBoundingClientRect().width));
        }
        container.remove();
        return result;
    });
    assert.deepEqual(widths, [400, 400, 333]);
});

test('compiled UI Col applies documented offsets and centering', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiGrid.lib.avt'),
        join(root, 'src/RuntimeUiGrid.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiGrid.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => {
        const row = document.createElement('div');
        row.style.width = '600px';
        row.innerHTML = '<av-col size="4" offset="2" offset_right="2" center>centered</av-col>';
        document.body.append(row);
        const column = row.querySelector('av-col');
        const style = getComputedStyle(column);
        const result = {
            width: Math.round(column.getBoundingClientRect().width),
            left: Math.round(parseFloat(style.marginLeft)), right: Math.round(parseFloat(style.marginRight)),
            justify: style.justifyContent,
        };
        row.remove();
        return result;
    });
    assert.deepEqual(actual, { width: 200, left: 100, right: 100, justify: 'center' });
});

test('compiled UI Scrollable renders content and supports programmatic vertical scrolling', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiScrollable.lib.avt'),
        join(root, 'src/RuntimeUiScrollable.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiScrollable.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tag = RuntimeReference.RuntimeUiScrollable.getTag();
        const element = document.createElement(tag);
        Object.assign(element.style, { display: 'block', width: '200px', height: '100px' });
        element.innerHTML = '<div style="height:500px">Tall content</div>';
        document.body.append(element);
        await new Promise(resolve => setTimeout(resolve, 50));
        const initial = { y: element.y, yMax: element.yMax, slot: !!element.shadowRoot.querySelector('slot') };
        element.scrollY(50);
        await new Promise(resolve => setTimeout(resolve, 50));
        const after = { y: element.y, yMax: element.yMax };
        element.destructor?.();
        element.remove();
        return { tag, initial, after };
    });
    assert.deepEqual(actual, {
        tag: 'av-scrollable', initial: { y: 0, yMax: 400, slot: true },
        after: { y: 50, yMax: 400 },
    });
});

test('compiled UI Scrollable mouse_drag moves content with pointer events', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiScrollable.lib.avt'),
        join(root, 'src/RuntimeUiScrollable.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiScrollable.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const element = document.createElement(RuntimeReference.RuntimeUiScrollable.getTag());
        Object.assign(element.style, { display: 'block', width: '200px', height: '100px' });
        element.innerHTML = '<div style="height:500px">Tall content</div>';
        element.mouse_drag = true;
        document.body.append(element);
        await new Promise(resolve => setTimeout(resolve, 120));
        const before = element.y;
        element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pageY: 80, clientY: 80 }));
        element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pageY: 20, clientY: 20 }));
        element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pageY: 20, clientY: 20 }));
        await new Promise(resolve => setTimeout(resolve, 0));
        const result = { before, after: element.y, max: element.yMax };
        element.destructor?.();
        element.remove();
        return result;
    });
    assert.deepEqual(actual, { before: 0, after: 60, max: 400 });
});

test('documented percent scrolling methods belong to AdvancedScrollable', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiScrollable.lib.avt'),
        join(root, 'src/RuntimeUiScrollable.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiScrollable.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const simple = document.createElement(RuntimeReference.RuntimeUiScrollable.getTag());
        const simpleMethods = {
            x: typeof simple.scrollXPercent, y: typeof simple.scrollYPercent,
            position: typeof simple.scrollToPosition, autoRight: typeof simple.autoScrollRight,
        };
        const element = document.createElement(RuntimeReference.RuntimeUiScrollable.getAdvancedTag());
        Object.assign(element.style, { display: 'block', width: '200px', height: '100px' });
        element.innerHTML = '<div style="width:500px;height:500px">Large content</div>';
        element.x_scroll = true;
        document.body.append(element);
        await new Promise(resolve => setTimeout(resolve, 80));
        const events = [];
        element.onScrollChange.add((x, y) => events.push([x, y]));
        element.scrollYPercent(50);
        element.scrollXPercent(50);
        await new Promise(resolve => setTimeout(resolve, 80));
        const result = { simpleMethods, x: element.x, y: element.y, xMax: element.xMax, yMax: element.yMax, events: [...events] };
        const zoomEvents = [];
        element.onZoomChange.add(value => zoomEvents.push(value));
        element.min_zoom = 1;
        element.max_zoom = 2;
        element.zoomOnPoint(0, 0, 5);
        result.zoom = element.zoom;
        result.zoomEvents = zoomEvents;
        element.destructor?.();
        element.remove();
        return result;
    });
    assert.deepEqual(actual.simpleMethods, {
        x: 'undefined', y: 'undefined', position: 'undefined', autoRight: 'undefined',
    });
    assert.equal(actual.y, actual.yMax / 2);
    assert.equal(actual.x, actual.xMax / 2);
    assert.ok(actual.events.length > 0);
    assert.deepEqual(actual.events.at(-1), [actual.x, actual.y]);
    assert.equal(actual.zoom, 2);
    assert.deepEqual(actual.zoomEvents, [2]);
});

test('compiled AdvancedScrollable applies wheel momentum and disable blocks later deltas', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiScrollable.lib.avt'),
        join(root, 'src/RuntimeUiScrollable.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiScrollable.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const element = document.createElement(RuntimeReference.RuntimeUiScrollable.getAdvancedTag());
        Object.assign(element.style, { display: 'block', width: '200px', height: '100px' });
        element.innerHTML = '<div style="height:500px">Tall content</div>';
        document.body.append(element);
        await new Promise(resolve => setTimeout(resolve, 120));
        element.dispatchEvent(new WheelEvent('wheel', { deltaY: 80, bubbles: true, cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 180));
        const moving = element.y;
        element.disable = true;
        await new Promise(resolve => setTimeout(resolve, 1200));
        const settled = element.y;
        element.dispatchEvent(new WheelEvent('wheel', { deltaY: 80, bubbles: true, cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 180));
        const disabled = element.y;
        element.destructor?.();
        element.remove();
        return { moving, settled, disabled };
    });
    assert.ok(actual.moving > 0, JSON.stringify(actual));
    assert.ok(actual.settled > actual.moving, JSON.stringify(actual));
    assert.equal(actual.disabled, actual.settled);
});

test('compiled AdvancedScrollable vertical thumb drags the content', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiScrollable.lib.avt'),
        join(root, 'src/RuntimeUiScrollable.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiScrollable.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const start = await page.evaluate(async () => {
        const element = document.createElement(RuntimeReference.RuntimeUiScrollable.getAdvancedTag());
        Object.assign(element.style, { display: 'block', width: '200px', height: '100px' });
        element.innerHTML = '<div style="height:500px">Tall content</div>';
        document.body.append(element);
        await new Promise(resolve => setTimeout(resolve, 120));
        globalThis.runtimeAdvancedScroller = element;
        const thumb = element.shadowRoot.querySelector('.container-scroller.vertical .scroller');
        const rect = thumb.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, visible: rect.height > 0 };
    });
    assert.equal(start.visible, true);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x, start.y + 30, { steps: 3 });
    await page.mouse.up();
    const actual = await page.evaluate(() => {
        const result = { y: runtimeAdvancedScroller.y, max: runtimeAdvancedScroller.yMax };
        runtimeAdvancedScroller.destructor?.();
        runtimeAdvancedScroller.remove();
        return result;
    });
    assert.ok(actual.y > 0 && actual.y <= actual.max, JSON.stringify(actual));
});

test('compiled AdvancedScrollable pinch gesture changes zoom within configured limits', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiScrollable.lib.avt'),
        join(root, 'src/RuntimeUiScrollable.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiScrollable.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    await page.evaluate(async () => {
        const element = document.createElement(RuntimeReference.RuntimeUiScrollable.getAdvancedTag());
        Object.assign(element.style, { display: 'block', width: '220px', height: '120px' });
        element.innerHTML = '<div style="height:500px;width:500px">Large content</div>';
        element.pinch = true;
        element.max_zoom = 2;
        document.body.append(element);
        await new Promise(resolve => setTimeout(resolve, 120));
        globalThis.runtimePinchScroller = element;
    });
    const session = await page.context().newCDPSession(page);
    const touch = (id, x, y) => ({ id, x, y });
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touch(1, 50, 60), touch(2, 150, 60)] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [touch(1, 49, 60), touch(2, 151, 60)] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [touch(1, 40, 60), touch(2, 180, 60)] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const zoom = await page.evaluate(() => {
        const result = runtimePinchScroller.zoom;
        runtimePinchScroller.destructor?.();
        runtimePinchScroller.remove();
        return result;
    });
    assert.ok(zoom > 1 && zoom <= 2, `${zoom}`);
});

test('documented Scrollable zoom API belongs to AdvancedScrollable', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiScrollable.lib.avt'),
        join(root, 'src/RuntimeUiScrollable.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiScrollable.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => {
        const tags = {
            simple: RuntimeReference.RuntimeUiScrollable.getTag(),
            advanced: RuntimeReference.RuntimeUiScrollable.getAdvancedTag(),
        };
        const simple = document.createElement(tags.simple);
        const advanced = document.createElement(tags.advanced);
        return {
            tags,
            simple: {
                zoomOnPoint: typeof simple.zoomOnPoint, onZoomChange: typeof simple.onZoomChange,
                pinch: typeof simple.pinch, minZoom: typeof simple.min_zoom, maxZoom: typeof simple.max_zoom,
                momentumBreak: typeof simple.break,
            },
            advanced: {
                zoomOnPoint: typeof advanced.zoomOnPoint, onZoomChange: typeof advanced.onZoomChange,
                pinch: typeof advanced.pinch, minZoom: typeof advanced.min_zoom, maxZoom: typeof advanced.max_zoom,
                momentumBreak: typeof advanced.break,
            },
        };
    });
    assert.deepEqual(actual, {
        tags: { simple: 'av-scrollable', advanced: 'av-advanced-scrollable' },
        simple: {
            zoomOnPoint: 'undefined', onZoomChange: 'object', pinch: 'undefined',
            minZoom: 'undefined', maxZoom: 'undefined', momentumBreak: 'undefined',
        },
        advanced: {
            zoomOnPoint: 'function', onZoomChange: 'object', pinch: 'boolean',
            minZoom: 'number', maxZoom: 'number', momentumBreak: 'number',
        },
    });
});

test('compiled UI ButtonElement submits its native form only in submit mode', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-button'), join(root, 'src/RuntimeUiButton'), { recursive: true });
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiButton/RuntimeUiButton.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tag = RuntimeReference.RuntimeUiButton.Tag;
        const form = document.createElement('form');
        let submissions = 0;
        form.addEventListener('submit', event => { event.preventDefault(); submissions++; });
        const button = document.createElement(tag);
        form.append(button);
        document.body.append(form);
        await new Promise(resolve => setTimeout(resolve, 0));
        await button.submitForTest();
        const defaultState = { type: button.type, submissions, loading: button.loading };
        button.type = 'submit';
        await button.submitForTest();
        const submitState = { type: button.type, submissions, loading: button.loading };
        const holder = document.createElement('div');
        holder.innerHTML = `<${tag} type="submit"></${tag}>`;
        const keyboardButton = holder.firstElementChild;
        form.append(keyboardButton);
        await new Promise(resolve => setTimeout(resolve, 120));
        keyboardButton.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 0));
        const keyboardState = { type: keyboardButton.type, submissions, loading: keyboardButton.loading };
        await keyboardButton.submitForTest();
        const keyboardDirectSubmissions = submissions;
        keyboardButton.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
        keyboardButton.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
        await new Promise(resolve => setTimeout(resolve, 0));
        const pointerSubmissions = submissions;
        keyboardButton.destructor?.();
        button.destructor?.();
        form.remove();
        return { tag, defaultState, submitState, keyboardState, keyboardDirectSubmissions, pointerSubmissions };
    });
    assert.deepEqual(actual, {
        tag: 'rt-runtime-ui-button',
        defaultState: { type: 'button', submissions: 0, loading: false },
        submitState: { type: 'submit', submissions: 1, loading: false },
        keyboardState: { type: 'submit', submissions: 2, loading: false },
        keyboardDirectSubmissions: 3,
        pointerSubmissions: 4,
    });
});

test('compiled UI FormElement validates and synchronizes a native form value', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-form-element'), join(root, 'src/RuntimeUiInput'), { recursive: true });
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiInput/RuntimeUiInput.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tag = RuntimeReference.RuntimeUiInput.Tag;
        const form = document.createElement('form');
        const input = document.createElement(tag);
        input.setAttribute('name', 'answer');
        const changes = [];
        input.onChange.add(value => changes.push(value));
        form.append(input);
        document.body.append(form);
        await new Promise(resolve => setTimeout(resolve, 0));
        const invalid = await input.validate();
        const before = { invalid, errors: [...input.errors], valid: input.nativeValidity(),
            formValue: new FormData(form).get('answer') };
        input.change('hello');
        await new Promise(resolve => setTimeout(resolve, 0));
        const valid = await input.validate();
        const after = { valid, errors: [...input.errors], nativeValid: input.nativeValidity(),
            formValue: new FormData(form).get('answer'), changes };
        input.destructor?.();
        form.remove();
        return { tag, before, after };
    });
    assert.deepEqual(actual, {
        tag: 'rt-runtime-ui-input',
        before: { invalid: false, errors: ['required'], valid: false, formValue: null },
        after: { valid: true, errors: [], nativeValid: true, formValue: 'hello', changes: ['hello'] },
    });
});

test('compiled UI FormElement links both ways to FormHandler and releases subscriptions', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-form-element'), join(root, 'src/RuntimeUiInput'), { recursive: true });
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiInput/RuntimeUiInput.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const handler = RuntimeReference.RuntimeUiInput.createHandler();
        const part = handler.parts.answer;
        const input = document.createElement(RuntimeReference.RuntimeUiInput.Tag);
        document.body.append(input);
        input.form = part;
        await new Promise(resolve => setTimeout(resolve, 0));
        const initial = { value: input.value, handlerValue: handler.item.answer };
        handler.item.answer = 'external';
        await new Promise(resolve => setTimeout(resolve, 0));
        const fromHandler = { value: input.value, handlerValue: handler.item.answer };
        input.change('internal');
        await new Promise(resolve => setTimeout(resolve, 0));
        const fromInput = { value: input.value, handlerValue: handler.item.answer };
        input.change('');
        const validation = await input.validate();
        const invalid = { validation, errors: [...input.errors] };
        input.destructor?.();
        input.remove();
        handler.item.answer = 'after-destroy';
        await new Promise(resolve => setTimeout(resolve, 0));
        const afterDestroy = { value: input.value, handlerValue: handler.item.answer };
        return { initial, fromHandler, fromInput, invalid, afterDestroy };
    });
    assert.deepEqual(actual, {
        initial: { value: 'start', handlerValue: 'start' },
        fromHandler: { value: 'external', handlerValue: 'external' },
        fromInput: { value: 'internal', handlerValue: 'internal' },
        invalid: { validation: false, errors: ['required', 'Le champs answer est requis'] },
        afterDestroy: { value: '', handlerValue: 'after-destroy' },
    });
});

test('compiled UI GridHelper renders its grid and creates guides', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiGridHelper.lib.avt'),
        join(root, 'src/RuntimeUiGridHelper.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiGridHelper.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const actual = await page.evaluate(async () => {
        const storage = new Map();
        Object.defineProperty(window, 'localStorage', { configurable: true, value: {
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, String(value)),
            removeItem: key => storage.delete(key),
        } });
        const tag = RuntimeReference.RuntimeUiGridHelper.getTag();
        const element = document.createElement(tag);
        Object.assign(element.style, { display: 'block', width: '400px', height: '300px' });
        document.body.append(element);
        await new Promise(resolve => setTimeout(resolve, 120));
        const initial = { registered: typeof customElements.get(tag), unit: element.unit,
            hasShadow: !!element.shadowRoot, grid: !!element.shadowRoot?.querySelector('.grid'),
            width: element.offsetWidth, height: element.offsetHeight,
            columns: element.shadowRoot?.querySelectorAll('.cols .col').length,
            rows: element.shadowRoot?.querySelectorAll('.rows .row').length };
        const beforeShortcut = element.show_grid;
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', bubbles: true }));
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
        document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'k', ctrlKey: true, bubbles: true }));
        document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'Control', bubbles: true }));
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
        document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'g', bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 0));
        const afterShortcut = element.show_grid;
        element.lock = false;
        const beforeLockPress = element.lock;
        const lockControl = element.shadowRoot.querySelector('.lock');
        lockControl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
        lockControl.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
        await new Promise(resolve => setTimeout(resolve, 0));
        const afterLockPress = element.lock;
        element.unit = 'px';
        const conversion = { inPx: element.inPx(20), fromPx: element.fromPx(20) };
        element.createGuideFromLeft(30);
        element.createGuideFromTop(40);
        await new Promise(resolve => setTimeout(resolve, 0));
        const guides = element.shadowRoot?.querySelectorAll('av-grid-guide-helper').length;
        const savedKeys = [...storage.keys()];
        const savedValue = storage.get('grid-helper');
        element.destructor?.();
        element.remove();
        const restored = document.createElement(tag);
        document.body.append(restored);
        await new Promise(resolve => setTimeout(resolve, 120));
        const restoredGuides = restored.shadowRoot?.querySelectorAll('av-grid-guide-helper').length;
        restored.destructor?.();
        restored.remove();
        return { tag, initial, beforeShortcut, afterShortcut, beforeLockPress, afterLockPress, conversion, guides,
            savedKeys, savedValue, restoredGuides };
    });
    assert.deepEqual({ ...actual, pageErrors }, {
        tag: 'av-grid-helper',
        initial: { registered: 'function', unit: 'px', hasShadow: true, grid: true,
            width: 400, height: 300, columns: 25, rows: 19 },
        beforeShortcut: true, afterShortcut: false, beforeLockPress: false, afterLockPress: false,
        conversion: { inPx: 20, fromPx: 20 }, guides: 2,
        savedKeys: ['grid-helper'], savedValue: '{"x":[40],"y":[30]}',
        restoredGuides: 2,
        pageErrors: [],
    });
});

test('compiled UI GridHelper continues initialization with an injected resize observer', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiGridHelper.lib.avt'),
        join(root, 'src/RuntimeUiGridHelper.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiGridHelper.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const actual = await page.evaluate(async () => {
        const storage = new Map();
        Object.defineProperty(window, 'localStorage', { configurable: true, value: {
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, String(value)),
            removeItem: key => storage.delete(key),
        } });
        Aventus.ResizeObserver = class {
            constructor(config) { this.config = config; }
            observe() { return this; }
        };
        const element = document.createElement(RuntimeReference.RuntimeUiGridHelper.getTag());
        Object.assign(element.style, { display: 'block', width: '400px', height: '300px' });
        document.body.append(element);
        await new Promise(resolve => setTimeout(resolve, 120));
        const initial = { columns: element.shadowRoot.querySelectorAll('.cols .col').length,
            rows: element.shadowRoot.querySelectorAll('.rows .row').length,
            grid: element.show_grid, lock: element.lock };
        const shortcut = async letter => {
            document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', bubbles: true }));
            document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
            document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'k', ctrlKey: true, bubbles: true }));
            document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'Control', bubbles: true }));
            document.body.dispatchEvent(new KeyboardEvent('keydown', { key: letter, bubbles: true }));
            document.body.dispatchEvent(new KeyboardEvent('keyup', { key: letter, bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 0));
        };
        await shortcut('g');
        await shortcut('l');
        const toggled = { grid: element.show_grid, lock: element.lock };
        element.magnetic = 5;
        element.createGuideFromLeft(30);
        await new Promise(resolve => setTimeout(resolve, 120));
        const guide = element.shadowRoot.querySelector('av-grid-guide-helper');
        guide.onStart();
        const moving = guide.moving;
        guide.onMoveY({ pageX: 38, pageY: 50 });
        guide.onStop();
        const moved = { moving, stopped: guide.moving, left: guide.style.left,
            saved: storage.get('grid-helper') };
        return { initial, toggled, moved };
    });
    await page.locator('av-grid-guide-helper').dblclick({ force: true });
    const afterDoublePress = await page.evaluate(() => {
        const element = document.querySelector('av-grid-helper');
        const count = element.shadowRoot.querySelectorAll('av-grid-guide-helper').length;
        element.destructor?.();
        element.remove();
        return { count };
    });
    assert.deepEqual({ ...actual, afterDoublePress, pageErrors }, {
        initial: { columns: 25, rows: 19, grid: true, lock: true },
        toggled: { grid: false, lock: false },
        moved: { moving: true, stopped: false, left: '40px', saved: '{"x":[],"y":[40]}' },
        afterDoublePress: { count: 0 }, pageErrors: [],
    });
});

test('compiled UI ModalElement resolves and rejects a displayed dialog', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-modal'), join(root, 'src/RuntimeUiModal'), { recursive: true });
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiModal/RuntimeUiModal.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tag = RuntimeReference.RuntimeUiModal.Tag;
        const accepted = document.createElement(tag);
        const acceptPromise = accepted.show();
        await new Promise(resolve => setTimeout(resolve, 120));
        const shown = { connected: accepted.isConnected,
            content: !!accepted.shadowRoot?.querySelector('.modal'),
            role: accepted.shadowRoot?.querySelector('.modal')?.getAttribute('role') ?? null };
        accepted.accept();
        const acceptValue = await acceptPromise;
        const acceptedRemoved = !accepted.isConnected;
        const cancelled = document.createElement(tag);
        const cancelPromise = cancelled.show();
        cancelled.cancel();
        const cancelValue = await cancelPromise;
        const cancelledRemoved = !cancelled.isConnected;
        const escaped = document.createElement(tag);
        const escapePromise = escaped.show();
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        const escapeOutcome = await Promise.race([
            escapePromise.then(value => ({ resolved: true, value })),
            new Promise(resolve => setTimeout(() => resolve({ resolved: false }), 30)),
        ]);
        if(!escapeOutcome.resolved) escaped.cancel();
        const escapedRemoved = !escaped.isConnected;
        return { tag, shown, acceptValue, acceptedRemoved, cancelValue, cancelledRemoved,
            escapeOutcome, escapedRemoved };
    });
    assert.deepEqual(actual, {
        tag: 'rt-runtime-ui-modal', shown: { connected: true, content: true, role: 'dialog' },
        acceptValue: true, acceptedRemoved: true, cancelValue: false, cancelledRemoved: true,
        escapeOutcome: { resolved: true, value: false }, escapedRemoved: true,
    });
});

test('compiled UI ModalElement global defaults apply to a new subclass instance', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-modal'), join(root, 'src/RuntimeUiModal'), { recursive: true });
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiModal/RuntimeUiDefaultModal.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const Modal = RuntimeReference.RuntimeUiDefaultModal;
        const before = document.createElement(Modal.Tag).optionsForTest();
        const clicked = document.createElement(Modal.Tag);
        const clickPromise = clicked.show();
        clicked.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 2 }));
        clicked.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 2 }));
        const clickOutcome = await Promise.race([
            clickPromise.then(value => ({ resolved: true, value })),
            new Promise(resolve => setTimeout(() => resolve({ resolved: false }), 30)),
        ]);
        if(!clickOutcome.resolved) clicked.cancel();
        const inside = document.createElement(Modal.Tag);
        const insidePromise = inside.show();
        const content = inside.shadowRoot.querySelector('.modal');
        content.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 3 }));
        content.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 3 }));
        const insideOutcome = await Promise.race([
            insidePromise.then(value => ({ resolved: true, value })),
            new Promise(resolve => setTimeout(() => resolve({ resolved: false }), 30)),
        ]);
        if(!insideOutcome.resolved) inside.cancel();
        Modal.configureDefaults();
        const instance = document.createElement(Modal.Tag);
        const after = instance.optionsForTest();
        const promise = instance.show();
        instance.cancel();
        const cancelValue = await promise;
        return { before, clickOutcome, insideOutcome, after, cancelValue };
    });
    assert.deepEqual(actual, {
        before: { closeWithClick: true, closeWithEsc: true, rejectValue: null },
        clickOutcome: { resolved: true, value: null },
        insideOutcome: { resolved: false },
        after: { closeWithClick: false, closeWithEsc: false, rejectValue: false },
        cancelValue: false,
    });
});

test('compiled UI Page invokes visibility hooks and renders its template', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-page'), join(root, 'src/RuntimeUiPage'), { recursive: true });
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiPage/RuntimeUiPage.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tag = RuntimeReference.RuntimeUiPage.Tag;
        const element = document.createElement(tag);
        document.body.append(element);
        await new Promise(resolve => setTimeout(resolve, 0));
        const initial = { visible: element.visible, content: element.shadowRoot.textContent.trim(),
            events: [...element.events] };
        await element.show();
        await element.show();
        await element.hide();
        const after = { visible: element.visible, events: [...element.events], config: element.configure() };
        element.destructor?.();
        element.remove();
        return { tag, initial, after };
    });
    assert.deepEqual(actual, {
        tag: 'rt-runtime-ui-page',
        initial: { visible: false, content: 'Runtime page content', events: ['hide'] },
        after: { visible: false, events: ['hide', 'show', 'show', 'hide'],
            config: { title: 'Runtime page', description: 'Compiled page', keywords: ['runtime'] } },
    });
});

test('compiled UI Router registers and activates Page routes', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-page'), join(root, 'src/RuntimeUiPage'), { recursive: true });
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = [
        './src/RuntimeUiPage/RuntimeUiPage.wcl.avt',
        './src/RuntimeUiPage/RuntimeUiRouter.wcl.avt',
    ];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        Object.defineProperty(window, 'localStorage', { configurable: true, value: {
            getItem: () => null, setItem() {}, removeItem() {},
        } });
        const tag = RuntimeReference.RuntimeUiRouter.Tag;
        const router = document.createElement(tag);
        document.body.append(router);
        await new Promise(resolve => setTimeout(resolve, 120));
        const started = { initializing: router.initializing, transitions: [...router.transitions],
            pages: router.shadowRoot.querySelectorAll('rt-runtime-ui-page').length,
            title: document.title, active: router.activeForTest() };
        const navigated = await router.navigate('/other');
        await new Promise(resolve => setTimeout(resolve, 30));
        const after = { navigated, transitions: [...router.transitions],
            pages: router.shadowRoot.querySelectorAll('rt-runtime-ui-page').length,
            active: router.activeForTest(),
            visible: Array.from(router.shadowRoot.querySelectorAll('rt-runtime-ui-page'), element => element.visible) };
        router.destructor?.();
        router.remove();
        return { tag, started, after };
    });
    assert.deepEqual(actual, {
        tag: 'rt-runtime-ui-router',
        started: { initializing: false, transitions: ['>/home'], pages: 1,
            title: 'Runtime page', active: '/home' },
        after: { navigated: true, transitions: ['>/home', '/home>/other'],
            pages: 2, active: '/other', visible: [false, true] },
    });
});

test('compiled UI Tabs initializes headers and switches selected panels', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-tabs'), join(root, 'src/RuntimeTabs'), { recursive: true });
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = [
        './src/RuntimeTabs/RuntimeTab.wcl.avt',
        './src/RuntimeTabs/RuntimeTabHeader.wcl.avt',
        './src/RuntimeTabs/RuntimeTabs.wcl.avt',
    ];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const actual = await page.evaluate(async () => {
        const tags = { tabs: RuntimeReference.RuntimeTabs.Tag,
            tab: RuntimeReference.RuntimeTab.Tag,
            header: RuntimeReference.RuntimeTabHeader.Tag };
        const documentedTags = { tabs: typeof customElements.get('av-tabs'),
            tab: typeof customElements.get('av-tab') };
        const container = document.createElement(tags.tabs);
        const first = document.createElement(tags.tab);
        first.label = 'first';
        first.textContent = 'First panel';
        const second = document.createElement(tags.tab);
        second.label = 'second';
        second.textContent = 'Second panel';
        container.append(first, second);
        document.body.append(container);
        await new Promise(resolve => setTimeout(resolve, 120));
        const headers = Array.from(container.shadowRoot.querySelectorAll(tags.header));
        const initial = { count: headers.length, labels: headers.map(header => header.textContent),
            selected: [first.selected, second.selected],
            display: [first.style.display, second.style.display] };
        const byIndex = container.setActive(1);
        const indexed = { selected: [first.selected, second.selected],
            headers: headers.map(header => header.active) };
        const byName = container.setActive('first');
        const named = { selected: [first.selected, second.selected],
            headers: headers.map(header => header.active) };
        const third = document.createElement(tags.tab);
        third.label = 'third';
        third.textContent = 'Third panel';
        container.append(third);
        await new Promise(resolve => setTimeout(resolve, 120));
        const dynamic = { count: container.shadowRoot.querySelectorAll(tags.header).length,
            selected: [first.selected, second.selected, third.selected], loaded: third.loaded };
        const invalidIndex = container.setActive(10);
        const invalidName = container.setActive('missing');
        const afterInvalid = { selected: [first.selected, second.selected, third.selected],
            headers: headers.map(header => header.active) };
        container.destructor?.();
        container.remove();
        return { tags, documentedTags, initial, byIndex, indexed, byName, named, dynamic,
            invalidIndex, invalidName, afterInvalid };
    });
    assert.deepEqual({ ...actual, pageErrors }, {
        tags: { tabs: 'rt-runtime-tabs', tab: 'rt-runtime-tab', header: 'rt-runtime-tab-header' },
        documentedTags: { tabs: 'undefined', tab: 'undefined' },
        initial: { count: 2, labels: ['first', 'second'],
            selected: [true, false], display: ['', 'none'] },
        byIndex: true, indexed: { selected: [false, true], headers: [false, true] },
        byName: true, named: { selected: [true, false], headers: [true, false] },
        dynamic: { count: 3, selected: [true, false, false], loaded: true },
        invalidIndex: false, invalidName: false,
        afterInvalid: { selected: [true, false, false], headers: [true, false] },
        pageErrors: [],
    });
});

test('compiled UI Tabs responds to a browser click and a removed panel', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-tabs'), join(root, 'src/RuntimeTabs'), { recursive: true });
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = [
        './src/RuntimeTabs/RuntimeTab.wcl.avt',
        './src/RuntimeTabs/RuntimeTabHeader.wcl.avt',
        './src/RuntimeTabs/RuntimeTabs.wcl.avt',
    ];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    await page.evaluate(async () => {
        const container = document.createElement(RuntimeReference.RuntimeTabs.Tag);
        container.id = 'runtime-tabs-click';
        for(const label of ['first', 'second']) {
            const tab = document.createElement(RuntimeReference.RuntimeTab.Tag);
            tab.label = label;
            tab.textContent = label;
            container.append(tab);
        }
        document.body.append(container);
        await new Promise(resolve => setTimeout(resolve, 120));
    });
    await page.locator('rt-runtime-tab-header').nth(1).click();
    const actual = await page.evaluate(async () => {
        const container = document.querySelector('#runtime-tabs-click');
        const first = container.children[0];
        const second = container.children[1];
        const clicked = [first.selected, second.selected];
        second.remove();
        await new Promise(resolve => setTimeout(resolve, 30));
        const afterRemoval = { headers: container.shadowRoot.querySelectorAll('rt-runtime-tab-header').length,
            firstSelected: first.selected };
        container.destructor?.();
        container.remove();
        return { clicked, afterRemoval };
    });
    assert.deepEqual(actual, {
        clicked: [false, true], afterRemoval: { headers: 1, firstSelected: true },
    });
});

test('the documented dependances key silently skips the configured build', t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiDependency.lib.avt'),
        join(root, 'src/RuntimeUiDependency.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.dependances = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiDependency.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const result = runBuild(root);
    assert.equal(result.error, undefined, result.error?.message);
    const report = JSON.parse(result.stdout);
    assert.equal(report.success, true);
    assert.deepEqual(report.builds, {});
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
});

test('a root dependencies key loads the UI package for a selected build', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/ui-dependency/RuntimeUiDependency.lib.avt'),
        join(root, 'src/RuntimeUiDependency.lib.avt'));
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.dependencies = { 'Aventus@UI': {} };
    config.build[0].compile[0].input = ['./src/RuntimeUiDependency.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => ({
        tag: RuntimeReference.RuntimeUiDependency.getTag(),
        registered: typeof customElements.get('av-progress-circle'),
    }));
    assert.deepEqual(actual, { tag: 'av-progress-circle', registered: 'function' });
});

test('build-level module and component prefix override the project defaults', async t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].module = 'AlternateRuntime';
    config.build[0].componentPrefix = 'alt';
    config.build[0].compile[0].input = ['./src/RuntimeList/RuntimeList.wcl.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const result = runBuild(root);
    assert.equal(result.error, undefined, result.error?.message);
    const report = JSON.parse(result.stdout);
    assert.equal(report.success, true, result.stdout);
    assert.equal(report.builds['AlternateRuntime@Main']?.success, true, result.stdout);
    const code = readFileSync(join(root, 'dist/runtime-reference.js'), 'utf8');
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tag = AlternateRuntime.RuntimeList.Tag;
        const element = document.createElement(tag);
        document.body.append(element);
        await new Promise(resolve => setTimeout(resolve, 0));
        const result = {
            tag, registered: typeof customElements.get(tag),
            rows: Array.from(element.shadowRoot.querySelectorAll('li'), node => node.textContent.trim()),
        };
        element.destructor();
        element.remove();
        return result;
    });
    assert.deepEqual(actual, { tag: 'alt-runtime-list', registered: 'function', rows: ['alpha', 'beta'] });
});

test('hideWarnings removes documentation warnings without hiding compilation errors', async t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeFunction.lib.avt'];
    config.build[0].forceDocumentation = true;
    config.build[0].hideWarnings = false;
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const visible = runBuild(root);
    assert.equal(visible.error, undefined, visible.error?.message);
    const visibleReport = JSON.parse(visible.stdout);
    assert.equal(visibleReport.success, true, visible.stdout);
    assert.ok(visibleReport.builds['RuntimeReference@Main'], visible.stdout);
    assert.match(JSON.stringify(visibleReport.builds['RuntimeReference@Main'].diagnostics), /You should add documentation/);

    config.build[0].forceDocumentation = false;
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const optional = runBuild(root);
    assert.equal(optional.error, undefined, optional.error?.message);
    const optionalReport = JSON.parse(optional.stdout);
    assert.equal(optionalReport.success, true, optional.stdout);
    assert.doesNotMatch(JSON.stringify(optionalReport.builds['RuntimeReference@Main'].diagnostics), /You should add documentation/);

    config.build[0].forceDocumentation = true;
    config.build[0].hideWarnings = true;
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const hidden = runBuild(root);
    assert.equal(hidden.error, undefined, hidden.error?.message);
    const hiddenReport = JSON.parse(hidden.stdout);
    assert.equal(hiddenReport.success, true, hidden.stdout);
    assert.doesNotMatch(JSON.stringify(hiddenReport.builds['RuntimeReference@Main'].diagnostics), /You should add documentation/);
    const code = readFileSync(join(root, 'dist/runtime-reference.js'), 'utf8');
    const page = await openCompiledPage(t, code);
    assert.equal(await page.evaluate(() => RuntimeReference.runtimeUpper('warning')), 'WARNING');

    const sourcePath = join(root, 'src/RuntimeFunction.lib.avt');
    writeFileSync(sourcePath, readFileSync(sourcePath, 'utf8').replace('value.toUpperCase()', 'value.notAFunction()'));
    const invalid = runBuild(root);
    assert.equal(invalid.error, undefined, invalid.error?.message);
    const invalidReport = JSON.parse(invalid.stdout);
    assert.equal(invalidReport.success, false);
    const diagnostics = JSON.stringify(invalidReport.builds['RuntimeReference@Main'].diagnostics);
    assert.match(diagnostics, /notAFunction/);
    assert.doesNotMatch(diagnostics, /You should add documentation/);
});

test('project documentation options are inherited by builds and can be overridden', t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeFunction.lib.avt'];
    config.forceDocumentation = true;
    config.hideWarnings = false;
    delete config.build[0].forceDocumentation;
    delete config.build[0].hideWarnings;
    const diagnostics = () => {
        writeFileSync(configPath, JSON.stringify(config, null, 2));
        const build = runBuild(root);
        assert.equal(build.error, undefined, build.error?.message);
        const report = JSON.parse(build.stdout);
        assert.equal(report.success, true, build.stdout);
        return JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics);
    };
    assert.match(diagnostics(), /You should add documentation/);
    config.hideWarnings = true;
    assert.doesNotMatch(diagnostics(), /You should add documentation/);
    config.hideWarnings = false;
    config.build[0].forceDocumentation = false;
    assert.doesNotMatch(diagnostics(), /You should add documentation/);
});

test('build description overrides project description in generated package metadata', t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.description = 'Project description';
    config.build[0].compile[0].input = ['./src/RuntimeFunction.lib.avt'];
    config.build[0].compile[0].package = './dist/RuntimeReference@Main.package.avt';
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    buildProject(root);
    const packagePath = join(root, 'dist/RuntimeReference@Main.package.avt');
    assert.match(readFileSync(packagePath, 'utf8'), /description:Project description/);
    config.build[0].description = 'Build description';
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    buildProject(root);
    const text = readFileSync(packagePath, 'utf8');
    assert.match(text, /description:Build description/);
    assert.doesNotMatch(text, /description:Project description/);
});

test('build outputNpm generates an importable module with package metadata', async t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].version = '2.3.4';
    config.build[0].organization = 'AventusRuntime';
    config.build[0].compile[0].input = ['./src/RuntimeFunction.lib.avt'];
    config.build[0].compile[0].outputNpm = {
        path: './npm', packageJson: true, npmName: '@runtime/reference', live: true,
    };
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    buildProject(root);
    const npmPath = join(root, 'npm');
    const packagePath = join(npmPath, 'package.json');
    assert.equal(existsSync(packagePath), true);
    const metadata = JSON.parse(readFileSync(packagePath, 'utf8'));
    assert.equal(metadata.name, '@runtime/reference');
    assert.equal(metadata.type, 'module');
    assert.equal(metadata.version, '2.3.4');
    assert.equal(metadata.author.name, 'AventusRuntime');
    assert.equal(existsSync(join(npmPath, 'index.js')), true);
    assert.equal(existsSync(join(npmPath, 'index.d.ts')), true);
    const module = await import(pathToFileURL(join(npmPath, 'index.js')).href);
    assert.deepEqual(Object.keys(module), ['RuntimeReference']);
    assert.equal(module.RuntimeReference.runtimeUpper('npm'), 'NPM');
});

test('build outputNpm manifest describes the compiled custom element', t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeList/RuntimeList.wcl.avt'];
    config.build[0].compile[0].outputNpm = {
        path: './npm', packageJson: true, npmName: '@runtime/reference', manifest: true, live: true,
    };
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    buildProject(root);
    const npmPath = join(root, 'npm');
    const paths = [
        'custom-elements.json', 'vscode.html-custom-data.json',
        'web-types.json', 'emmet/snippets.json',
    ];
    for (const path of paths) {
        assert.equal(existsSync(join(npmPath, path)), true, path);
    }
    const customElements = JSON.parse(readFileSync(join(npmPath, paths[0]), 'utf8'));
    const vscode = JSON.parse(readFileSync(join(npmPath, paths[1]), 'utf8'));
    const webTypes = JSON.parse(readFileSync(join(npmPath, paths[2]), 'utf8'));
    assert.match(JSON.stringify(customElements), /rt-runtime-list/);
    assert.match(JSON.stringify(vscode), /rt-runtime-list/);
    assert.match(JSON.stringify(webTypes), /rt-runtime-list/);
});

test('Storybook configuration without live export keeps the normal bundle build', t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeList/RuntimeList.wcl.avt'];
    config.build[0].stories = { output: './storybook', live: false };
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    buildProject(root);
    assert.equal(existsSync(join(root, 'storybook')), false);
});

test('@Storybook and @StoryValue compile with live story export', async t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    for (const extension of ['wcl', 'wcv']) {
        cpSync(join(root, `cases/storybook-decorators/RuntimeStorybook.${extension}.avt`),
            join(root, `src/RuntimeStorybook.${extension}.avt`));
    }
    config.build[0].compile[0].input = ['./src/RuntimeStorybook.wcl.avt'];
    config.build[0].stories = { output: './storybook', live: false };
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const buildResult = runBuild(root);
    assert.equal(buildResult.status, 0, buildResult.stdout || buildResult.stderr);
    const code = readFileSync(join(root, 'dist/runtime-reference.js'), 'utf8');
    const page = await openCompiledPage(t, code);
    assert.equal(await page.evaluate(() => {
        const element = document.createElement(RuntimeReference.RuntimeStorybook.Tag);
        document.body.append(element);
        const result = element.shadowRoot.querySelector('p')?.textContent;
        element.remove();
        return result;
    }), 'actual');
    config.build[0].stories.live = true;
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const live = runBuild(root);
    assert.equal(live.error, undefined, live.error?.message);
    assert.equal(JSON.parse(live.stdout).builds['RuntimeReference@Main'].success, true);
    assert.equal(existsSync(join(root, 'storybook/generated')), true);
});

test('live Storybook export builds the bundle and Storybook files', t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeList/RuntimeList.wcl.avt'];
    config.build[0].stories = { output: './storybook', live: true };
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const build = runBuild(root);
    assert.equal(build.error, undefined, build.error?.message);
    const report = JSON.parse(build.stdout);
    assert.equal(report.success, true);
    assert.equal(report.builds['RuntimeReference@Main'].success, true);
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), true);
    const storyRoot = join(root, 'storybook');
    assert.equal(existsSync(join(storyRoot, '.storybook')), true);
    assert.equal(existsSync(join(storyRoot, 'generated')), true);
    assert.equal(existsSync(join(storyRoot, 'auto')), true);
});

test('followFolders namespace strategy leaves a library at the module root', async t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeNamespace/RuntimeScoped.lib.avt'];
    config.namespaceStrategy = 'followFolders';
    config.namespaceRoot = './src';
    config.build[0].namespaceStrategy = 'followFolders';
    config.build[0].namespaceRoot = './src';
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => ({
        scoped: RuntimeReference.RuntimeNamespace?.RuntimeScoped?.name(),
        rootValue: RuntimeReference.RuntimeScoped?.name(),
    }));
    assert.deepEqual(actual, { scoped: undefined, rootValue: 'scoped' });
});

for (const [strategy, extra] of [
    ['followFoldersCamelCase', { namespaceRoot: './src' }],
    ['rules', { namespaceRules: { Configured: ['./src/RuntimeNamespace/*'] } }],
]) {
    test(`${strategy} namespace strategy leaves a library at the module root`, async t => {
        const root = copyProject(t);
        const configPath = join(root, 'aventus.conf.avt');
        const config = JSON.parse(readFileSync(configPath, 'utf8'));
        config.build[0].compile[0].input = ['./src/RuntimeNamespace/RuntimeScoped.lib.avt'];
        Object.assign(config, { namespaceStrategy: strategy, ...extra });
        Object.assign(config.build[0], { namespaceStrategy: strategy, ...extra });
        writeFileSync(configPath, JSON.stringify(config, null, 2));
        const { code } = buildProject(root);
        const page = await openCompiledPage(t, code);
        const actual = await page.evaluate(() => ({
            root: RuntimeReference.RuntimeScoped?.name(),
            folder: RuntimeReference.RuntimeNamespace?.RuntimeScoped?.name(),
            configured: RuntimeReference.Configured?.RuntimeScoped?.name(),
        }));
        assert.deepEqual(actual, { root: 'scoped', folder: undefined, configured: undefined });
    });
}

test('compiled library exports a root function, constant, and enum', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => ({
        functionType: typeof RuntimeReference.runtimeUpper,
        result: RuntimeReference.runtimeUpper?.('hello'),
        number: RuntimeReference.runtimeNumber,
        mode: RuntimeReference.RuntimeFunctionMode?.Second,
    }));
    assert.deepEqual(actual, { functionType: 'function', result: 'HELLO', number: 7, mode: 2 });
});

test('compiled Internal decorator keeps a class usable inside its package but hides its export', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => ({
        internalExport: typeof RuntimeReference.RuntimeInternal,
        internalUsage: RuntimeReference.RuntimeDecoratorConsumer.inspect(),
    }));
    assert.deepEqual(actual, { internalExport: 'undefined', internalUsage: 'internal' });
});

test('documented Required class decorator compiles and exports the class', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/required-class/RuntimeRequired.lib.avt'),
        join(root, 'src/RuntimeRequired.lib.avt'));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    assert.equal(await page.evaluate(() => RuntimeReference.RuntimeRequired.value()), 'required');
});

test('documented Dependances spelling is rejected while the compiler declares Dependencies', t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/dependances-doc/RuntimeDependances.lib.avt'),
        join(root, 'src/RuntimeDependances.lib.avt'));
    const result = runBuild(root);
    assert.equal(result.error, undefined, result.error?.message);
    const report = JSON.parse(result.stdout);
    assert.equal(report.success, false);
    const diagnostics = JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics);
    assert.match(diagnostics, /RuntimeDependances\.lib\.avt/);
    assert.match(diagnostics, /Cannot find name.*Dependances/);
});

test('a library re-export from another file reports the LSP unsupported-export diagnostic', t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/re-export/RuntimeReexport.lib.avt'),
        join(root, 'src/RuntimeReexport.lib.avt'));
    const result = runBuild(root);
    assert.equal(result.error, undefined, result.error?.message);
    const report = JSON.parse(result.stdout);
    assert.equal(report.success, false);
    const diagnostics = JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics);
    assert.match(diagnostics, /RuntimeReexport\.lib\.avt/);
    assert.match(diagnostics, /Re-exports from another file are not supported by Aventus/);
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
});

test('Dependencies decorator includes CallbackGroup from the base library', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/callback-dependency/RuntimeForcedCallbackGroup.lib.avt'),
        join(root, 'src/RuntimeForcedCallbackGroup.lib.avt'));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeCallbackLibrary.inspect());
    assert.deepEqual(actual, {
        events: ['first:a', 'second:a', 'second:b', 'error:failed', 'info:ready'],
        returns: [1, 2],
        groupAvailable: true,
    });
});

test('compiled Callback and CallbackGroup dispatch listeners', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeCallbackLibrary.inspect());
    assert.deepEqual(actual, {
        events: ['first:a', 'second:a', 'second:b', 'error:failed', 'info:ready'],
        returns: [1, 2],
        groupAvailable: true,
    });
});

test('compiled GenericError and result containers report success, errors, and short-circuit chains', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeErrors.inspect());
    assert.deepEqual(actual, {
        valid: { success: true, result: { lower: 'hello' }, errors: 0 },
        invalid: { success: false, missingResult: true, code: 400, message: 'Please provide a string', containsCode: true },
        validation: { success: false, extracted: { lower: 'world' }, skipped: false, genericSuccess: false },
    });
});

test('compiled DragAndDrop moves an element into a target and emits drop callbacks', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    await page.evaluate(() => {
        const element = document.createElement('div');
        element.id = 'drag-element';
        Object.assign(element.style, { position: 'absolute', left: '20px', top: '20px', width: '20px', height: '20px', background: 'red' });
        const target = document.createElement('div');
        target.id = 'drag-target';
        Object.assign(target.style, { position: 'absolute', left: '150px', top: '20px', width: '50px', height: '50px', background: 'blue' });
        document.body.append(element, target);
        window.dragEvents = [];
        window.dragInstance = RuntimeReference.RuntimeDrag.attach(element, target, window.dragEvents);
    });
    await page.mouse.move(30, 30);
    await page.mouse.down();
    await page.mouse.move(40, 30);
    await page.mouse.move(170, 30);
    await page.mouse.up();
    const actual = await page.evaluate(() => {
        const element = document.querySelector('#drag-element');
        const result = { left: element.style.left, events: [...window.dragEvents] };
        window.dragInstance.destroy();
        element.remove();
        document.querySelector('#drag-target').remove();
        return result;
    });
    assert.equal(actual.left, '160px');
    assert.equal(actual.events[0], 'start');
    assert.ok(actual.events.includes('move'));
    assert.deepEqual(actual.events.slice(-2), ['drop:1', 'stop']);
});

test('compiled ResizeObserver wraps native resize notifications', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const available = RuntimeReference.RuntimeResize.available();
        const target = document.createElement('div');
        target.style.width = '20px';
        target.style.height = '20px';
        document.body.append(target);
        const seen = [];
        let error;
        try {
            const observer = RuntimeReference.RuntimeResize.observe(target, entries => {
                seen.push(entries.map(entry => ({ target: entry.target === target, width: entry.contentRect.width })));
            });
            await new Promise(resolve => setTimeout(resolve, 250));
            target.style.width = '40px';
            await new Promise(resolve => setTimeout(resolve, 250));
            observer.disconnect();
        } catch (caught) {
            error = caught.message;
        }
        target.remove();
        return { available, seen, error };
    });
    assert.equal(actual.available, true);
    assert.ok(actual.seen.length >= 2, JSON.stringify(actual));
    assert.ok(actual.seen.flat().every(entry => entry.target));
    assert.ok(actual.seen.flat().some(entry => entry.width === 20));
    assert.ok(actual.seen.flat().some(entry => entry.width === 40));
    assert.equal(actual.error, undefined);
});

test('compiled Animation starts, stops, and respects its frame rate', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const available = RuntimeReference.RuntimeAnimation.available();
        const originalRequest = window.requestAnimationFrame;
        const originalCancel = window.cancelAnimationFrame;
        window.requestAnimationFrame = callback => setTimeout(() => callback(performance.now()), 5);
        window.cancelAnimationFrame = id => clearTimeout(id);
        try {
            return { available, result: await RuntimeReference.RuntimeAnimation.inspect() };
        } finally {
            window.requestAnimationFrame = originalRequest;
            window.cancelAnimationFrame = originalCancel;
        }
    });
    assert.equal(actual.available, true);
    assert.deepEqual(actual.result.initial, { fps: 60, started: false });
    assert.equal(actual.result.started, true);
    assert.equal(actual.result.afterStop.fps, 120);
    assert.equal(actual.result.afterStop.started, false);
    assert.ok(actual.result.afterStop.frames > 0);
    assert.equal(actual.result.afterStop.stopped, 1);
    assert.ok(actual.result.finalFrames >= actual.result.afterStop.frames);
    assert.equal(actual.result.finalStopped, 1);
});

test('compiled Ram subclass stores, updates and removes Data instances', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const { RuntimePerson, RuntimePersonRAM } = RuntimeReference;
        const ram = RuntimePersonRAM.getInstance();
        const sameSingleton = ram === RuntimePersonRAM.getInstance();
        const events = [];
        ram.onCreated(person => events.push('created:' + person.name));
        ram.onUpdated(person => events.push('updated:' + person.name));
        ram.onDeleted(person => events.push('deleted:' + person.name));
        const created = await ram.create({ id: 3, name: 'Ada', active: true });
        const read = await ram.get(3);
        const updated = await ram.update({ id: 3, name: 'Grace', active: false });
        const afterUpdate = { name: read.name, active: read.active };
        const removed = await ram.deleteById(3);
        const missing = await ram.get(3);
        return {
            sameSingleton, typed: created instanceof RuntimePerson,
            sameRead: read === created, sameUpdate: updated === created,
            afterUpdate, sameRemoved: removed === created, missing: missing === undefined, events,
        };
    });
    assert.deepEqual(actual, {
        sameSingleton: true, typed: true, sameRead: true, sameUpdate: true,
        afterUpdate: { name: 'Grace', active: false }, sameRemoved: true, missing: true,
        events: ['created:Ada', 'updated:Grace', 'deleted:Grace'],
    });
});

test('compiled GenericRam indexes Data by a string key', async t => {
    const root = copyProject(t);
    for (const file of ['RuntimeStringPerson.data.avt', 'RuntimeStringPersonRAM.ram.avt']) {
        cpSync(join(root, 'cases/generic-ram', file), join(root, 'src', file));
    }
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeStringPersonRAM.ram.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const { RuntimeStringPerson, RuntimeStringPersonRAM } = RuntimeReference;
        const ram = RuntimeStringPersonRAM.getInstance();
        const created = await ram.create({ id: 'person-1', name: 'Ada' });
        const read = await ram.get('person-1');
        const updated = await ram.update({ id: 'person-1', name: 'Grace' });
        const name = read.name;
        const deleted = await ram.deleteById('person-1');
        return {
            typed: created instanceof RuntimeStringPerson,
            sameRead: read === created,
            sameUpdate: updated === created,
            name,
            sameDeleted: deleted === created,
            missing: await ram.get('person-1') === undefined,
        };
    });
    assert.deepEqual(actual, {
        typed: true, sameRead: true, sameUpdate: true, name: 'Grace',
        sameDeleted: true, missing: true,
    });
});

test('compiled Ram item callbacks are scoped to the item and can be removed', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const events = await page.evaluate(() => RuntimeReference.RuntimeRamCallbacks.inspect());
    assert.deepEqual(events, ['update:Grace', 'delete:Grace']);
});

test('compiled Ram mixin adds methods to stored Data and keeps them on retrieval', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const ram = RuntimeReference.RuntimePersonExtendedRAM.getInstance();
        const created = await ram.create({ id: 17, name: 'Ada', active: true });
        const read = await ram.get(17);
        const initial = read?.helloWorld?.();
        const updated = await ram.update({ id: 17, name: 'Grace', active: false });
        return {
            initial,
            updated: updated?.helloWorld?.(),
            same: created === read && read === updated,
            dataType: read instanceof RuntimeReference.RuntimePerson,
        };
    });
    assert.deepEqual(actual, { initial: 'Hello Ada', updated: 'Hello Grace', same: true, dataType: true });
});

test('compiled Ram list operations preserve order, identity, and detailed results', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const ram = RuntimeReference.RuntimePersonRAM.getInstance();
        const created = await ram.createList([
            { id: 31, name: 'Ada', active: true },
            { id: 32, name: 'Lin', active: false },
        ]);
        const createdNames = created.map(item => item.name);
        const byIds = await ram.getByIds([32, 31]);
        const list = await ram.getList();
        const all = await ram.getAll();
        const records = await ram.getRecords();
        const recordsIds = [...records.keys()];
        const detailed = await ram.getWithError(31);
        const updated = await ram.updateList([
            { id: 31, name: 'Grace', active: false },
            { id: 32, name: 'Lee', active: true },
        ]);
        const afterUpdate = updated.map(item => item.name);
        const deleted = await ram.deleteList(updated);
        const afterDelete = await ram.getList();
        return {
            created: createdNames,
            byIds: byIds.map(item => item.id),
            list: list.map(item => item.id),
            allIsMap: all instanceof Map,
            allIds: [...all].map(item => item.id),
            recordsIsMap: records instanceof Map,
            recordsIds,
            detailed: { success: detailed.success, same: detailed.result === created[0] },
            afterUpdate,
            sameUpdated: updated.every((item, index) => item === created[index]),
            deleted: deleted.map(item => item.id),
            afterDelete: afterDelete.length,
        };
    });
    assert.deepEqual(actual, {
        created: ['Ada', 'Lin'], byIds: [32, 31], list: [31, 32],
        allIsMap: false, allIds: [31, 32], recordsIsMap: true, recordsIds: [31, 32],
        detailed: { success: true, same: true }, afterUpdate: ['Grace', 'Lee'],
        sameUpdated: true, deleted: [31, 32], afterDelete: 0,
    });
});

test('compiled HttpRouter and HttpRoute send a bound JSON request through their configured URL', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const calls = [];
        window.fetch = async (url, options) => {
            calls.push({ url, method: options.method, body: options.body });
            return new Response(JSON.stringify({ accepted: 'Ada' }), {
                status: 200, headers: { 'Content-Type': 'application/json' },
            });
        };
        const route = new RuntimeReference.RuntimeHttpRoute();
        const detachedSave = route.save;
        const result = await detachedSave('Ada');
        return { success: result.success, value: result.result, calls };
    });
    assert.deepEqual(actual, {
        success: true, value: { accepted: 'Ada' },
        calls: [{ url: 'https://example.test/api/people/save', method: 'POST', body: '{"name":"Ada"}' }],
    });
});

test('compiled HttpRequest decodes text and blob and handles empty and failed responses', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const calls = [];
        window.fetch = async (url, options) => {
            calls.push({ url, method: options.method });
            if (url.endsWith('/text')) return new Response('plain response', { status: 200 });
            if (url.endsWith('/blob')) return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
            return new Response(null, { status: 204 });
        };
        const route = new RuntimeReference.RuntimeHttpRoute();
        const text = await route.loadText();
        const blob = await route.loadBlob();
        const removed = await route.remove();
        window.fetch = async () => new Response('unavailable', { status: 503, statusText: 'Unavailable' });
        const failed = await route.loadText();
        return {
            text: { success: text.success, value: text.result },
            blob: { success: blob.success, bytes: [...new Uint8Array(await blob.result.arrayBuffer())] },
            removed: { success: removed.success, errors: removed.errors.length },
            failed: { success: failed.success, status: failed.errors[0]?.status, message: failed.errors[0]?.message },
            calls,
        };
    });
    assert.deepEqual(actual, {
        text: { success: true, value: 'plain response' },
        blob: { success: true, bytes: [1, 2, 3] },
        removed: { success: true, errors: 0 },
        failed: { success: false, status: 503, message: '503 Unavailable' },
        calls: [
            { url: 'https://example.test/api/people/text', method: 'GET' },
            { url: 'https://example.test/api/people/blob', method: 'GET' },
            { url: 'https://example.test/api/people/remove', method: 'DELETE' },
        ],
    });
});

test('compiled HttpRequest hooks surround transport and can set headers', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const events = [];
        RuntimeReference.RuntimeHttpRoute.installHooks(events);
        let headers;
        window.fetch = async (url, options) => {
            events.push('fetch');
            headers = options.headers;
            return new Response('hooked response', { status: 200 });
        };
        const route = new RuntimeReference.RuntimeHttpRoute();
        const response = await route.loadText();
        Aventus.HttpRequest.configure({});
        return { events, success: response.success, text: response.result, headers };
    });
    assert.deepEqual(actual.events, ['before', 'fetch', 'after:true']);
    assert.equal(actual.success, true);
    assert.equal(actual.text, 'hooked response');
    assert.ok(actual.headers.some(([name, value]) => name === 'X-Runtime' && value === 'hooked'));
});

test('compiled Watch and Signal callbacks distinguish deep edits from assignment', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tick = () => new Promise(resolve => setTimeout(resolve, 0));
        const component = document.createElement('rt-runtime-callbacks');
        document.body.append(component);
        await tick();
        const reflected = {
            watch: component.hasAttribute('model'),
            signal: component.hasAttribute('signalModel'),
        };
        const { RuntimeCallbacks } = RuntimeReference;
        RuntimeCallbacks.watchEvents.length = 0;
        RuntimeCallbacks.signalEvents.length = 0;
        component.model.child.count = 2;
        component.signalModel.count = 2;
        await tick();
        const deep = {
            watch: [...RuntimeCallbacks.watchEvents], signal: [...RuntimeCallbacks.signalEvents],
            text: component.shadowRoot.querySelector('p').textContent.trim(),
        };
        RuntimeCallbacks.watchEvents.length = 0;
        component.model.child.note = 'new';
        delete component.model.child.note;
        const structural = [...RuntimeCallbacks.watchEvents];
        RuntimeCallbacks.watchEvents.length = 0;
        component.model = { child: { count: 3 } };
        component.signalModel = { count: 3 };
        await tick();
        const assigned = {
            watch: [...RuntimeCallbacks.watchEvents], signal: [...RuntimeCallbacks.signalEvents],
            text: component.shadowRoot.querySelector('p').textContent.trim(),
        };
        component.destructor();
        component.remove();
        return { reflected, deep, structural, assigned };
    });
    assert.deepEqual(actual, {
        reflected: { watch: false, signal: false },
        deep: { watch: [{ action: 'UPDATED', path: 'model.child.count', value: 2 }], signal: [], text: '2' },
        structural: [
            { action: 'CREATED', path: 'model.child.note', value: 'new' },
            { action: 'DELETED', path: 'model.child.note', value: 'new' },
        ],
        assigned: { watch: [{ action: 'UPDATED', path: 'model', value: 3 }], signal: [3], text: '3' },
    });
});

test('compiled press directives invoke callbacks and clean listeners on destruction', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tick = () => new Promise(resolve => setTimeout(resolve, 0));
        const component = document.createElement('rt-runtime-press');
        document.body.append(component);
        await tick();
        const button = component.shadowRoot.querySelector('button');
        const pointer = (type, x = 10) => new PointerEvent(type, {
            bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0,
            clientX: x, clientY: 10,
        });
        button.dispatchEvent(pointer('pointerdown'));
        document.dispatchEvent(pointer('pointerup'));
        await tick();
        const active = { events: [...component.events], count: component.count,
            text: component.shadowRoot.querySelector('p').textContent.trim() };
        button.dispatchEvent(pointer('pointerdown'));
        document.dispatchEvent(pointer('pointermove', 40));
        document.dispatchEvent(pointer('pointermove', 45));
        document.dispatchEvent(pointer('pointerup', 45));
        const dragged = { events: [...component.events], count: component.count };
        const doubleButton = component.shadowRoot.querySelector('.double');
        for (let i = 0; i < 2; i++) {
            doubleButton.dispatchEvent(pointer('pointerdown'));
            document.dispatchEvent(pointer('pointerup'));
        }
        const longButton = component.shadowRoot.querySelector('.long');
        longButton.dispatchEvent(pointer('pointerdown'));
        await new Promise(resolve => setTimeout(resolve, 20));
        document.dispatchEvent(pointer('pointerup'));
        const gestures = [...component.events];
        component.destructor();
        button.dispatchEvent(pointer('pointerdown'));
        document.dispatchEvent(pointer('pointerup'));
        const destroyed = { events: [...component.events], count: component.count };
        component.remove();
        return { active, dragged, gestures, destroyed };
    });
    assert.deepEqual(actual, {
        active: { events: ['start', 'press', 'stop'], count: 1, text: '1' },
        dragged: { events: ['start', 'press', 'stop', 'start', 'drag-start', 'drag', 'drag-end', 'stop'], count: 1 },
        gestures: ['start', 'press', 'stop', 'start', 'drag-start', 'drag', 'drag-end', 'stop', 'double', 'long'],
        destroyed: { events: ['start', 'press', 'stop', 'start', 'drag-start', 'drag', 'drag-end', 'stop', 'double', 'long'], count: 1 },
    });
});

test('the compiled classic loop updates nested Context entries and removes a group', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tick = () => new Promise(resolve => setTimeout(resolve, 0));
        const component = document.createElement('rt-runtime-nested');
        document.body.append(component);
        await tick();
        const shadow = component.shadowRoot;
        const groups = () => Array.from(shadow.querySelectorAll('section.group'), section => ({
            name: section.querySelector('h2').textContent.trim(),
            entries: Array.from(section.querySelectorAll('.entry'), node => node.textContent.trim()),
        }));
        const result = { initial: groups() };
        const secondSection = shadow.querySelectorAll('section.group')[1];
        component.groups[0].entries.push('d');
        await tick();
        result.afterPush = groups();
        result.otherGroupPreserved = shadow.querySelectorAll('section.group')[1] === secondSection;
        component.groups[0].entries.splice(1, 1);
        await tick();
        result.afterEntryRemove = groups();
        component.groups.splice(0, 1);
        await tick();
        result.afterRemove = groups();
        component.remove();
        return result;
    });
    assert.deepEqual(actual, {
        initial: [{ name: 'first', entries: ['a', 'b'] }, { name: 'second', entries: ['c'] }],
        afterPush: [{ name: 'first', entries: ['a', 'b', 'd'] }, { name: 'second', entries: ['c'] }],
        otherGroupPreserved: true,
        afterEntryRemove: [{ name: 'first', entries: ['a', 'd'] }, { name: 'second', entries: ['c'] }],
        afterRemove: [{ name: 'second', entries: ['c'] }],
    });
});

test('compiled classic loop updates rows after reverse and unshift', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tick = () => new Promise(resolve => setTimeout(resolve, 0));
        const component = document.createElement('rt-runtime-nested');
        document.body.append(component);
        const shadow = component.shadowRoot;
        const rows = () => Array.from(shadow.querySelectorAll('.group'), group => ({
            index: group.getAttribute('data-index'),
            name: group.querySelector('h2').textContent.trim(),
            entries: Array.from(group.querySelectorAll('.entry'), entry => ({
                index: entry.getAttribute('data-index'), value: entry.textContent.trim(),
            })),
        }));
        await tick();
        const initial = rows();
        component.groups.reverse();
        await tick();
        const reversed = rows();
        component.groups[0].entries.unshift('z');
        await tick();
        const reordered = rows();
        const model = component.groups.map(group => ({ name: group.name, entries: [...group.entries] }));
        component.destructor();
        component.groups.reverse();
        await tick();
        const destroyed = rows();
        component.remove();
        return { initial, reversed, reordered, model, destroyed };
    });
    assert.deepEqual(actual.initial, [
            { index: '0', name: 'first', entries: [{ index: '0', value: 'a' }, { index: '1', value: 'b' }] },
            { index: '1', name: 'second', entries: [{ index: '0', value: 'c' }] },
    ]);
    assert.deepEqual(actual.model, [
        { name: 'second', entries: ['z', 'c'] },
        { name: 'first', entries: ['a', 'b'] },
    ]);
    assert.deepEqual(actual.reversed, [
        { index: '0', name: 'second', entries: [{ index: '0', value: 'c' }] },
        { index: '1', name: 'first', entries: [{ index: '0', value: 'a' }, { index: '1', value: 'b' }] },
    ]);
    assert.deepEqual(actual.reordered, [
        { index: '0', name: 'second', entries: [{ index: '0', value: 'z' }, { index: '1', value: 'c' }] },
        { index: '1', name: 'first', entries: [{ index: '0', value: 'a' }, { index: '1', value: 'b' }] },
    ]);
    assert.deepEqual(actual.destroyed, []);
});

test('compiled Debugger decorator exposes Watch history and clearing on a component', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const component = document.createElement('rt-runtime-reactivity');
        document.body.append(component);
        await new Promise(resolve => component.onReady(resolve));
        const initial = component.getWatchHistory?.().length;
        component.model.child.count = 8;
        const history = component.getWatchHistory?.();
        const latest = history?.at(-1);
        let clearError;
        try {
            component.clearWatchHistory?.();
        } catch (error) {
            clearError = error.message;
        }
        const afterClear = component.getWatchHistory?.().length;
        component.destructor();
        component.remove();
        return { initial, length: history?.length, latest, clearError, afterClear };
    });
    assert.equal(actual.initial, 1);
    assert.equal(actual.length, 2);
    assert.equal(actual.afterClear, 0);
    assert.match(actual.clearError, /clearHistory is not a function/);
    assert.match(JSON.stringify(actual.latest), /count/);
});

test('compiled decorators and templates react to nested edits, replacements, and injected component proxies', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        const tick = () => new Promise(resolve => setTimeout(resolve, 0));
        const source = document.createElement('rt-runtime-reactivity');
        const target = document.createElement('rt-runtime-reactivity');
        document.body.append(source, target);
        await tick();
        const text = (element, selector) => element.shadowRoot.querySelector(selector).textContent.trim();
        const rows = element => Array.from(element.shadowRoot.querySelectorAll('li'), node => node.textContent.trim());
        const result = { initial: [text(source, '.count'), text(source, '.signal'), text(source, '.label'), rows(source)] };
        source.model.child.count = 2;
        source.model.items.push('beta');
        source.signalModel.count = 2;
        await tick();
        result.nested = [text(source, '.count'), text(source, '.signal'), rows(source)];
        source.signalModel = { count: 3 };
        source.label = 'changed';
        await tick();
        result.replaced = [text(source, '.signal'), text(source, '.label'), source.getAttribute('label')];
        source.setAttribute('label', 'from attribute');
        await tick();
        result.attributeUpdate = [source.label, text(source, '.label')];
        source.model.child = { count: 4 };
        target.injected = source.model.child;
        await tick();
        result.injectedInitial = text(target, '.injected');
        source.model.child.count = 5;
        await tick();
        result.injectedUpdated = [text(source, '.count'), text(target, '.injected')];
        target.injected.count = 6;
        await tick();
        result.reverseUpdate = [text(source, '.count'), text(target, '.injected')];
        source.remove();
        target.remove();
        return result;
    });
    assert.deepEqual(actual, {
        initial: ['1', '1', 'initial', ['alpha']],
        nested: ['2', '1', ['alpha', 'beta']],
        replaced: ['3', 'changed', 'changed'],
        attributeUpdate: ['from attribute', 'from attribute'],
        injectedInitial: '4',
        injectedUpdated: ['5', '5'],
        reverseUpdate: ['6', '6'],
    });
});
