import type { ActionElement, ActionEvent } from "../../../html/parser/definition";
export interface NativeTemplateOptions {
    name: string; tag: string; members: string; html: string; css: string;
    elements: ActionElement[]; events: ActionEvent[]; observed: string[];
    defaults: string; callbacks: string;
}
/** An expression usable in bundles, modules and copied scripts. */
export function nativeComponentExpression(options: NativeTemplateOptions): string {
    const { name, tag, members, html, css, elements, events, observed, defaults, callbacks } = options;
    const q = JSON.stringify;
    let selectors = "";
    for (const element of elements) {
        const selector = element.ids.map(id => `[_id=${q(id)}]`).join(",");
        selectors += `this[${q(element.name)}] = ${element.isArray ? `Array.from(root.querySelectorAll(${q(selector)}))` : `root.querySelector(${q(selector)})`};\n`;
    }
    const listeners = events.map(event => `root.querySelector(${q(`[_id=${q(event.id)}]`)})?.addEventListener(${q(event.eventName)}, (event) => this[${q(event.fct)}](event));`).join("\n");
    return `(() => {
        class NativeWebComponent extends HTMLElement {
            postCreation() {} postConnect() {} postDisconnect() {}
        }
        class ${name} extends NativeWebComponent { ${members} }
        const prototype = ${name}.prototype;
        const connected = prototype.connectedCallback;
        const disconnected = prototype.disconnectedCallback;
        const changed = prototype.attributeChangedCallback;
        const initialized = new WeakSet();
        const template = document.createElement('template');
        template.innerHTML = ${q(html)};
        Object.defineProperty(${name}, 'observedAttributes', { get: () => ${q(observed)} });
        prototype.connectedCallback = function () {
            if (!initialized.has(this)) {
                const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
                if (${q(css)}) { const style = document.createElement('style'); style.textContent = ${q(css)}; root.append(style); }
                root.append(template.content.cloneNode(true));
                ${selectors}
                ${listeners}
                ${defaults}
                initialized.add(this);
                for (const name of ${q(observed)}) { switch (name) { ${callbacks} } }
                this.postCreation();
            }
            connected?.call(this);
            this.postConnect();
        };
        prototype.disconnectedCallback = function () { disconnected?.call(this); this.postDisconnect(); };
        prototype.attributeChangedCallback = function (name, oldValue, newValue) {
            if (initialized.has(this) && oldValue !== newValue) { switch (name) { ${callbacks} } }
            changed?.call(this, name, oldValue, newValue);
        };
        if (!customElements.get(${q(tag)})) customElements.define(${q(tag)}, ${name});
        return ${name};
    })()`;
}
