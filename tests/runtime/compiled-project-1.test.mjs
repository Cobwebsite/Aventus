import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { chromium } from 'playwright';

import { copyProject, runBuild, buildProject, openCompiledPage } from './helpers/compiled-project.mjs';

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

test('static Aventus script is included once in the compiled browser bundle', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    assert.match(code, /__aventusRuntimeStatic/);
    assert.doesNotMatch(code, /declare global\s*\{/);
    const page = await openCompiledPage(t, code);
    const value = await page.evaluate(() => globalThis.__aventusRuntimeStatic);
    assert.equal(value, 1);
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
    writeFileSync(sourcePath, readFileSync(sourcePath, 'utf8').replace(/    @NoType\(\)\r?\n/, ''));
    const result = runBuild(root);
    assert.equal(result.error, undefined, result.error?.message);
    const report = JSON.parse(result.stdout);
    assert.equal(report.success, false, result.stdout);
    assert.match(JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics),
        /You must define a type for the prop details/);
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

test('the obsolete dependances key prevents the configured build', t => {
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
    assert.equal(report.success, false, result.stdout);
    assert.deepEqual(report.builds, {});
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), false);
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

