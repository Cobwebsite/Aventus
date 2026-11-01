import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
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
        CSSStyleSheet: ElementStub, File: ElementStub,
        customElements, window: { customElements }, document: {},
    };
    runInNewContext(code, globals);
    assert.equal(typeof globals.RuntimeReference.RuntimeList, 'function');
    assert.equal(registrations.get('rt-runtime-list'), globals.RuntimeReference.RuntimeList);
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
