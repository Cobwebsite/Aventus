import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { Temporal } from 'temporal-polyfill';

export function loadRuntimeContext(overrides = {}) {
    const ElementStub = class {};
    const globals = {
        console, setTimeout, clearTimeout, Blob, FormData, Response, Headers, Temporal,
        HTMLElement: ElementStub, Element: ElementStub, Window: ElementStub,
        Node: ElementStub, SVGElement: ElementStub, SVGGElement: ElementStub,
        SVGRectElement: ElementStub, SVGEllipseElement: ElementStub,
        SVGSVGElement: ElementStub, SVGTextElement: ElementStub,
        CSSStyleSheet: ElementStub, File: ElementStub,
        customElements: { get() {}, define() {} }, window: {}, document: {},
        ...overrides,
    };
    const runtime = process.env.AVENTUS_TEST_RUNTIME ?? new URL('../../../base/dist/aventus.js', import.meta.url);
    runInNewContext(readFileSync(runtime, 'utf8'), globals);
    return globals;
}

export function loadRuntime(overrides = {}) {
    return loadRuntimeContext(overrides).Aventus;
}
