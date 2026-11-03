import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

function styleHarness(fetch) {
    class Sheet {
        cssRules = [];
        replaceSync(content) { this.cssRules = content ? [{ cssText: content }] : []; }
    }
    const nodes = [];
    const head = {
        querySelector(selector) { return nodes.find(node => selector === `style[data-name="${node.name}"]`) ?? null; },
        appendChild(node) { nodes.push(node); },
    };
    const document = {
        head,
        createElement() {
            return { innerHTML: '', setAttribute(_name, value) { this.name = value; } };
        },
        getElementsByTagName(name) { return name === 'head' ? [head] : []; },
    };
    return { Style: loadRuntime({ CSSStyleSheet: Sheet, document, fetch }).Style, nodes };
}

test('Style stores and replaces a sheet while refreshing its existing head node', () => {
    const { Style, nodes } = styleHarness();
    Style.store('card', '.card{color:red}');
    const sheet = Style.get('card');
    assert.equal(Style.getAsString('card'), '.card{color:red}');
    Style.appendToHead('card');
    Style.appendToHead('card');
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].innerHTML, '.card{color:red}');
    Style.store('card', '.card{color:blue}');
    assert.equal(Style.get('card'), sheet);
    assert.equal(nodes[0].innerHTML, '.card{color:blue}');
});

test('Style creates an empty sheet for an unknown name and exposes a default sheet', () => {
    const { Style } = styleHarness();
    assert.equal(Style.getAsString('missing'), '');
    assert.match(Style.getAsString('@default'), /:host/);
    assert.match(Style.sheetToString(Style.noAnimation), /transition: none/);
});

test('Style shares a pending remote load and preserves the loaded sheet on repeat', async () => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let fetches = 0;
    const { Style } = styleHarness(async () => {
        fetches++;
        await gate;
        return { async text() { return '.remote{color:green}'; } };
    });
    const first = Style.load('remote', '/style.css');
    const second = Style.load('remote', '/style.css');
    assert.equal(fetches, 1);
    release();
    await Promise.all([first, second]);
    assert.equal(Style.getAsString('remote'), '.remote{color:green}');
    await Style.load('remote', '/style.css');
    assert.equal(fetches, 1);
});

test('Style shares a failed load and retries on the next call', async () => {
    let fetches = 0;
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const failure = new Error('offline');
    const { Style } = styleHarness(async () => {
        fetches++;
        if(fetches === 1) {
            await gate;
            throw failure;
        }
        return { async text() { return '.recovered{display:block}'; } };
    });
    const first = Style.load('failed', '/missing.css');
    const concurrent = Style.load('failed', '/missing.css');
    assert.equal(fetches, 1);
    release();
    const failures = await Promise.allSettled([first, concurrent]);
    assert.equal(failures.every(result => result.status === 'rejected' && result.reason === failure), true);
    await Style.load('failed', '/missing.css');
    assert.equal(fetches, 2);
    assert.equal(Style.getAsString('failed'), '.recovered{display:block}');
});
