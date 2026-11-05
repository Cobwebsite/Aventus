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
        resourceLoaderType: 'function',
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

test('compiled alias import resolves a root library function and enum', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeAlias.inspect());
    assert.equal(actual, 'ALIAS:2');
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

test('build outsideModule exports declarations to the global scope', async t => {
    const root = copyProject(t);
    const configPath = join(root, 'aventus.conf.avt');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    config.build[0].compile[0].input = ['./src/RuntimeFunction.lib.avt'];
    config.build[0].outsideModule = ['./src/RuntimeFunction.lib.avt'];
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const { code } = buildProject(root);
    assert.match(code, /\}\)\(RuntimeReference\);\s*\(\(\) => \{/);
    assert.match(code, /__as1\(_, 'runtimeNumber', runtimeNumber\)/);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => ({
        global: typeof window.runtimeUpper,
        value: window.runtimeUpper?.('outside'),
        nested: typeof RuntimeReference?.runtimeUpper,
        number: window.runtimeNumber,
        enumValue: window.RuntimeFunctionMode?.Second,
    }));
    assert.deepEqual(actual, { global: 'function', value: 'OUTSIDE', nested: 'undefined', number: 7, enumValue: 2 });
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
        Object.assign(element.style, { display: 'block', width: '100px', height: '100px' });
        element.value = 35;
        element.stroke_width = 8;
        document.body.append(element);
        await new Promise(resolve => setTimeout(resolve, 250));
        element.render();
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

test('compiled ResizeObserver forwards native resize notifications', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(async () => {
        let nativeObserver;
        window.ResizeObserver = class {
            constructor(callback) { this.callback = callback; nativeObserver = this; }
            observe() {}
            unobserve() {}
            emit(target, width) { this.callback([{ target, contentRect: { width } }]); }
        };
        const available = RuntimeReference.RuntimeResize.available();
        const target = document.createElement('div');
        const seen = [];
        let error;
        try {
            const observer = RuntimeReference.RuntimeResize.observe(target, entries => {
                seen.push(entries.map(entry => ({ target: entry.target === target, width: entry.contentRect.width })));
            });
            nativeObserver.emit(target, 20);
            await new Promise(resolve => setTimeout(resolve, 50));
            nativeObserver.emit(target, 40);
            await new Promise(resolve => setTimeout(resolve, 50));
            observer.disconnect();
        } catch (caught) {
            error = caught.message;
        }
        return { available, seen, error };
    });
    assert.equal(actual.available, true);
    assert.ok(actual.seen.length >= 2, JSON.stringify(actual));
    assert.ok(actual.seen.flat().every(entry => entry.target));
    assert.ok(actual.seen.flat().some(entry => entry.width === 20));
    assert.ok(actual.seen.flat().some(entry => entry.width === 40));
    assert.equal(actual.error, undefined);
});

test('compiled Ram item callbacks are scoped to the item and can be removed', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const events = await page.evaluate(() => RuntimeReference.RuntimeRamCallbacks.inspect());
    assert.deepEqual(events, ['update:Grace', 'delete:Grace']);
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

