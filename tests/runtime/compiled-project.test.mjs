import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { JSDOM } from 'jsdom';

const fixture = resolve(import.meta.dirname, 'fixtures/reference-project');
const cli = resolve(import.meta.dirname, '../../cli/out/cli.js');

function copyProject(t) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-runtime-project-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    cpSync(fixture, root, { recursive: true,
        filter: source => source !== join(fixture, 'dist'),
    });
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

test('an invalid source reports a diagnostic but still writes an output', t => {
    const root = copyProject(t);
    const logic = join(root, 'src/RuntimeList/RuntimeList.wcl.avt');
    writeFileSync(logic, readFileSync(logic, 'utf8').replace('= "initial";', '= ;'));
    const result = runBuild(root);
    assert.equal(result.error, undefined, result.error?.message);
    const report = JSON.parse(result.stdout);
    assert.equal(report.success, false);
    assert.equal(report.builds['RuntimeReference@Main'].success, false);
    assert.match(JSON.stringify(report.builds['RuntimeReference@Main'].diagnostics), /RuntimeList\.wcl\.avt/);
    assert.equal(existsSync(join(root, 'dist/runtime-reference.js')), true);
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
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
        url: 'https://example.test/', runScripts: 'outside-only',
    });
    t.after(() => dom.window.close());
    dom.window.eval(code);
    const component = dom.window.document.createElement('rt-runtime-list');
    dom.window.document.body.append(component);
    await new Promise(resolve => setTimeout(resolve, 0));
    const shadow = component.shadowRoot;
    assert.ok(shadow);
    assert.deepEqual(Array.from(shadow.querySelectorAll('li'), node => node.textContent.trim()), ['alpha', 'beta']);
    const input = shadow.querySelector('input');
    assert.equal(input.value, 'initial');
    component.value = 'updated';
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(input.value, 'updated');
    assert.equal(shadow.querySelector('.current').textContent.trim(), 'updated');
    input.value = 'typed';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(component.value, 'typed');
    component.items.push('gamma');
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.deepEqual(Array.from(shadow.querySelectorAll('li'), node => node.textContent.trim()), ['alpha', 'beta', 'gamma']);
    component.items.splice(1, 1);
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.deepEqual(Array.from(shadow.querySelectorAll('li'), node => node.textContent.trim()), ['alpha', 'gamma']);
    input.value = 'changed';
    input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    assert.equal(component.value, 'changed');
    assert.equal(dom.window.Aventus.WebComponentInstance.getAllInstances(component.constructor).includes(component), true);
    component.remove();
    assert.equal(dom.window.Aventus.WebComponentInstance.getAllInstances(component.constructor).includes(component), false);
    component.value = 'after removal';
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(input.value, 'after removal');
});

test('the compiled conditional and object loop respond to changes and a click', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
        url: 'https://example.test/', runScripts: 'outside-only',
    });
    t.after(() => dom.window.close());
    dom.window.eval(code);
    const component = dom.window.document.createElement('rt-runtime-branches');
    dom.window.document.body.append(component);
    await new Promise(resolve => setTimeout(resolve, 0));
    const shadow = component.shadowRoot;
    assert.equal(shadow.querySelector('.even')?.textContent.trim(), 'Even 0');
    assert.equal(shadow.querySelector('.odd'), null);
    assert.deepEqual(Array.from(shadow.querySelectorAll('li'), node => node.textContent.trim()),
        ['first: one', 'second: two']);
    shadow.querySelector('button').click();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(component.count, 1);
    assert.equal(shadow.querySelector('.even'), null);
    assert.equal(shadow.querySelector('.odd')?.textContent.trim(), 'Odd 1');
    component.labels.third = 'three';
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.deepEqual(Array.from(shadow.querySelectorAll('li'), node => node.textContent.trim()),
        ['first: one', 'second: two', 'third: three']);
    delete component.labels.first;
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.deepEqual(Array.from(shadow.querySelectorAll('li'), node => node.textContent.trim()),
        ['second: two', 'third: three']);
    component.remove();
});

test('the compiled classic loop removes a group but does not render a nested Context push', async t => {
    const root = copyProject(t);
    const { code } = buildProject(root);
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
        url: 'https://example.test/', runScripts: 'outside-only',
    });
    t.after(() => dom.window.close());
    dom.window.eval(code);
    const component = dom.window.document.createElement('rt-runtime-nested');
    dom.window.document.body.append(component);
    await new Promise(resolve => setTimeout(resolve, 0));
    const shadow = component.shadowRoot;
    const groups = () => Array.from(shadow.querySelectorAll('section.group'), section => ({
        name: section.querySelector('h2').textContent.trim(),
        entries: Array.from(section.querySelectorAll('.entry'), node => node.textContent.trim()),
    }));
    assert.deepEqual(groups(), [
        { name: 'first', entries: ['a', 'b'] },
        { name: 'second', entries: ['c'] },
    ]);
    component.groups[0].entries.push('d');
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.deepEqual(groups()[0].entries, ['a', 'b']);
    component.groups.splice(0, 1);
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.deepEqual(groups(), [{ name: 'second', entries: ['c'] }]);
    component.remove();
});
