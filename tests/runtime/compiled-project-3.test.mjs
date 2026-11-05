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

test('compiled utility bundle includes uuidv4 and sleep functions', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeTools.utilityAvailability());
    assert.deepEqual(actual, { uuidAvailable: true, sleepAvailable: true });
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
