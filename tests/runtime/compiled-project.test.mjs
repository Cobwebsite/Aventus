import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

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

function buildProject(root) {
    const result = spawnSync(process.execPath, [cli, 'build', join(root, 'aventus.conf.avt'), '--json'], {
        cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024,
        env: { ...process.env, APPDATA: join(root, 'appdata') },
    });
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
    assert.match(code, /display:inline-block/);
    assert.doesNotMatch(code, /:host\{display:block\}/);
    assert.match(code, /class="revised"/);
    assert.match(code, /\["value"\] = "revision-value"/);
});
