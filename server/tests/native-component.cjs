const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relative, dependencies = {}) {
    const exports = {};
    const source = fs.readFileSync(path.join(__dirname, '../src', relative), 'utf8');
    const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(js, { exports, require: name => {
        if (name in dependencies) return dependencies[name];
        if (name === 'typescript') return ts;
        throw new Error('Unmocked dependency: ' + name);
    }});
    return exports;
}
const template = load('language-services/ts/component/compiler/nativeTemplate.ts');
const { AventusWebcomponentCompilerSimple } = load('language-services/ts/component/compiler/compilerSimple.ts', {
    '../../../../definition': { AventusErrorCode: { WrongTypeDefinition: 1 } },
    '../../../../tools': { createErrorTs: (_, message) => ({ message, severity: 1 }) },
    '../../LanguageService': { AventusTsLanguageService: { compileTs: () => ({ dependencies: [{ fullName: 'Aventus.NativeWebComponent' }], npm: {} }) } },
    '../../parser/decorators/TagNameDecorator': { TagNameDecorator: { is: d => d.name === 'TagName' ? { tagName: d.value } : null } },
    '../../parser/decorators/PropertyDecorator': { PropertyDecorator: { is: d => ({ fctTxt: d.callback }) } },
    '../../parser/AliasInfo': { AliasInfo: class {} },
    '../../parser/ParserTs': { ParserTs: { getBaseInfo: () => null } },
    './nativeTemplate': template
});
const actions = { elements: [{ name: 'button', ids: ['demo_1'], isArray: false }], events: [{ id: 'demo_1', eventName: 'click', fct: 'click' }], loops: [], ifs: [], injection: [], bindings: [], pressEvents: [], contextEdits: [], content: {} };
const field = (name, kind, value, decorator) => ({ name, type: { kind }, defaultValue: value, decorators: [decorator] });
const info = {
    name: 'DemoCard', fullName: 'DemoCard', namespace: '', isNativeWebcomponent: true, isExported: true,
    decorators: [{ name: 'TagName', value: 'demo-card' }], constructorContent: '', propertiesStatic: {}, methodsStatic: {},
    properties: { label: field('label', 'string', '"hello"', { name: 'Attribute' }),
        count: field('count', 'number', '2', { name: 'Property', callback: '(target) => { target.changes = (target.changes ?? 0) + 1; target.button.count = target.count; }' }),
        enabled: field('enabled', 'boolean', 'false', { name: 'Attribute' }) },
    methods: { click: { mustBeCompiled: true, decorators: [], compiledContent: 'click() { this.count++; this.context = this; }' },
        postCreation: { mustBeCompiled: true, decorators: [], compiledContent: 'postCreation() { this.creations = (this.creations ?? 0) + 1; }' },
        postConnect: { mustBeCompiled: true, decorators: [], compiledContent: 'postConnect() { this.connections = (this.connections ?? 0) + 1; }' } }
};
const file = { file: { documentInternal: {} }, fileParsed: { classes: { DemoCard: info } },
    HTMLFile: { fileParsed: { getParsedInfo: () => actions, blocksInfo: { default: '<button _id="demo_1">Click</button>' } } }, SCSSFile: { compileResult: ':host{display:block}' } };
const build = { tsLanguageService: { doValidation: () => [] }, getComponentPrefix: () => 'av', addNamespace() {} };
const result = new AventusWebcomponentCompilerSimple(file, build).compile();
assert.equal(result.diagnostics.length, 0);
assert.equal(result.nativeOutput.name, 'DemoCard.native.js');
assert.equal(result.result[0].dependencies.length, 0);
assert(!result.nativeOutput.content.includes('Aventus.'));
assert(!result.nativeOutput.content.includes('__decorate'));
assert(!result.nativeOutput.content.includes('= "use strict"'));

class Element {
    constructor() { this.attrs = new Map(); this.children = []; this.listeners = {}; }
    hasAttribute(key) { return this.attrs.has(key); }
    getAttribute(key) { return this.attrs.get(key) ?? null; }
    setAttribute(key, value) { const old = this.getAttribute(key); this.attrs.set(key, String(value)); if (this.constructor.observedAttributes?.includes(key)) this.attributeChangedCallback(key, old, String(value)); }
    removeAttribute(key) { const old = this.getAttribute(key); this.attrs.delete(key); if (old !== null && this.constructor.observedAttributes?.includes(key)) this.attributeChangedCallback(key, old, null); }
    attachShadow() { return this.shadowRoot = new Root(); }
    append(value) { this.children.push(value); }
    addEventListener(key, callback) { (this.listeners[key] ??= []).push(callback); }
}
class Root extends Element {
    querySelector() { return this.button ??= new Element(); }
    querySelectorAll() { return [this.querySelector()]; }
}
const registry = new Map();
const context = vm.createContext({ HTMLElement: Element, document: { createElement: () => ({ content: { cloneNode: () => ({}) } }) }, customElements: { get: key => registry.get(key), define: (key, value) => registry.set(key, value) } });
vm.runInContext(result.nativeOutput.content, context);
const Component = registry.get('demo-card');
const component = new Component();
component.setAttribute('count', '7'); // Initial observed attributes must not access unresolved selectors.
component.connectedCallback();
assert.equal(component.count, 7);
assert.equal(component.label, 'hello');
assert.equal(component.enabled, false);
assert.equal(component.changes, 1);
component.button.listeners.click[0]({ type: 'click' });
assert.equal(component.count, 8);
assert.equal(component.changes, 2);
assert.equal(component.context, component);
component.enabled = true;
assert.equal(component.getAttribute('enabled'), 'true');
component.enabled = false;
assert.equal(component.hasAttribute('enabled'), false);
component.label = null;
assert.equal(component.label, undefined);
component.disconnectedCallback();
component.connectedCallback();
assert.equal(component.creations, 1);
assert.equal(component.connections, 2);
assert.equal(component.button.listeners.click.length, 1);
assert.equal(component.shadowRoot.children.length, 2);
const second = new Component();
Object.defineProperty(second, 'count', { value: 9, configurable: true, writable: true });
second.connectedCallback();
assert.equal(second.count, 9);
assert.equal(second.getAttribute('count'), '9');
assert.notEqual(second.button, component.button);
// Re-evaluating a copied script must not re-register the custom element.
vm.runInContext(result.nativeOutput.content.replace('const DemoCard =', 'const AnotherCopy ='), context);
assert.equal(registry.get('demo-card'), Component);
actions.loops.push({});
const rejected = new AventusWebcomponentCompilerSimple(file, build).compile();
assert(rejected.diagnostics.some(d => d.message.includes('loops')));
assert.equal(rejected.nativeOutput, undefined);
assert.equal(rejected.result.length, 0);
const generatedFile = path.join(__dirname, 'fixtures/native/src/Counter.native.js');
if (fs.existsSync(generatedFile)) {
    const generated = fs.readFileSync(generatedFile, 'utf8');
    assert(!generated.includes('Aventus.'));
    vm.runInContext(generated, context);
    const Counter = registry.get('demo-counter');
    assert.equal(typeof vm.runInContext('Counter', context), 'function');
    const counter = new Counter();
    counter.connectedCallback();
    assert.equal(counter.count, 0);
    counter.increment();
    assert.equal(counter.count, 1);
    assert.equal(counter.output.textContent, '1');
    const badgeSource = fs.readFileSync(path.join(__dirname, 'fixtures/native/src/Badge.native.js'), 'utf8');
    vm.runInContext(badgeSource, context);
    const Badge = registry.get('demo-badge');
    const badge = new Badge();
    badge.connectedCallback();
    assert.equal(badge.label.textContent, 'Native');
}
console.log('Native component compiler and runtime checks passed');
