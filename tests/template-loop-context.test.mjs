import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

test('a removed parent loop item does not notify its nested loop before teardown', () => {
    const ElementStub = class {};
    const globals = {
        console,
        HTMLElement: ElementStub,
        Element: ElementStub,
        Window: ElementStub,
        Node: ElementStub,
        SVGElement: ElementStub,
        SVGGElement: ElementStub,
        SVGRectElement: ElementStub,
        SVGEllipseElement: ElementStub,
        SVGSVGElement: ElementStub,
        SVGTextElement: ElementStub,
        CSSStyleSheet: ElementStub,
        Blob,
        File: ElementStub,
        customElements: { get() {}, define() {} },
        window: {},
        document: {},
    };
    const runtime = process.env.AVENTUS_TEST_RUNTIME ?? new URL('../base/dist/aventus.js', import.meta.url);
    runInNewContext(readFileSync(runtime, 'utf8'), globals);
    const { Signal, TemplateContext } = globals.Aventus;
    const section = { title: 'Section' };
    const results = new Signal([{ sections: [section] }]);
    const component = { get results() { return results.value; } };
    const root = new TemplateContext(component);
    let destroyed = 0;
    const registry = { templates: [{ destructor() { destroyed++; } }] };
    const resultContext = new TemplateContext(component, {}, root, registry);
    resultContext.registerLoop('this.results', 0, 'index0', undefined, 'result', true);
    const nestedContext = new TemplateContext(component, {}, resultContext);
    nestedContext.registerLoop('result.sections', 0, 'index1', undefined, 'section', false);
    assert.equal(nestedContext.data.section.title, 'Section');

    results.value = [];

    assert.equal(destroyed, 0);
    assert.equal(nestedContext.data.section.title, 'Section');
    nestedContext.destructor();
    resultContext.destructor();
    root.destructor();
});
