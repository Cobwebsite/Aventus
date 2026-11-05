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

test('compiled Converter applies calendar schemas to Date, DateTime, and Time fields', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeCalendar.convert());
    assert.deepEqual(actual, {
        typed: true, day: '2024-02-29', moment: '2024-02-29T11:30:00Z', time: '23:30:00',
    });
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

test('compiled Mutex serializes concurrent async work', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    const actual = await page.evaluate(() => RuntimeReference.RuntimeTools.mutexOrder());
    assert.deepEqual(actual, ['start:1', 'end:1', 'start:2', 'end:2', 'start:3', 'end:3']);
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

test('compiled AdvancedScrollable applies wheel scrolling and disable blocks later deltas', async t => {
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
        window.requestAnimationFrame = callback => setTimeout(() => callback(performance.now()), 16);
        window.cancelAnimationFrame = id => clearTimeout(id);
        const element = document.createElement(RuntimeReference.RuntimeUiScrollable.getAdvancedTag());
        Object.assign(element.style, { display: 'block', width: '200px', height: '100px' });
        element.innerHTML = '<div style="height:500px">Tall content</div>';
        document.body.append(element);
        await new Promise(resolve => setTimeout(resolve, 120));
        element.dimensionRefreshed();
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
    assert.ok(actual.settled > actual.moving, JSON.stringify(actual));
    assert.equal(actual.disabled, actual.settled);
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

test('documented Required class decorator compiles and exports the class', async t => {
    const root = copyProject(t);
    cpSync(join(root, 'cases/required-class/RuntimeRequired.lib.avt'),
        join(root, 'src/RuntimeRequired.lib.avt'));
    const { code } = buildProject(root);
    const page = await openCompiledPage(t, code);
    assert.equal(await page.evaluate(() => RuntimeReference.RuntimeRequired.value()), 'required');
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
        component.clearWatchHistory?.();
        const afterClear = component.getWatchHistory?.().length;
        component.destructor();
        component.remove();
        return { initial, length: history?.length, latest, afterClear };
    });
    assert.equal(actual.initial, 1);
    assert.equal(actual.length, 2);
    assert.equal(actual.afterClear, 0);
    assert.match(JSON.stringify(actual.latest), /count/);
});

