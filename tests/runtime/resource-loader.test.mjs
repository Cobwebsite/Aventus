import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('ResourceLoader shares a pending text fetch and reuses the loaded content', async () => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let fetches = 0;
    const { ResourceLoader } = loadRuntime({ fetch: async () => {
        fetches++;
        await gate;
        return { async text() { return 'content'; } };
    } });
    const first = ResourceLoader.load('/file.css');
    const second = ResourceLoader.load('/file.css');
    assert.equal(fetches, 1);
    release();
    assert.deepEqual(await Promise.all([first, second]), ['content', 'content']);
    assert.equal(await ResourceLoader.load('/file.css'), 'content');
    assert.equal(fetches, 1);
});

test('ResourceLoader keeps independent URLs separate', async () => {
    const urls = [];
    const { ResourceLoader } = loadRuntime({ fetch: async url => {
        urls.push(url);
        return { async text() { return url; } };
    } });
    assert.deepEqual(await Promise.all([
        ResourceLoader.load('/first.js'), ResourceLoader.load('/second.js'),
    ]), ['/first.js', '/second.js']);
    assert.deepEqual(urls, ['/first.js', '/second.js']);
});

test('ResourceLoader.loadInHead shares a pending script and reuses its success', async () => {
    class FakeTag {
        listeners = new Map();
        attributes = new Map();
        addEventListener(type, callback) { this.listeners.set(type, callback); }
        setAttribute(name, value) {
            this.attributes.set(name, value);
            if(name === 'src') queueMicrotask(() => this.listeners.get('load')?.());
        }
    }
    class FakeLink extends FakeTag {}
    const appended = [];
    const document = {
        createElement: () => new FakeTag(),
        querySelector: () => null,
        head: { appendChild(tag) { appended.push(tag); } },
    };
    const { ResourceLoader } = loadRuntime({ document, HTMLLinkElement: FakeLink });
    const first = ResourceLoader.loadInHead({ url: '/app.js', type: 'js', nonce: 'test-nonce' });
    const second = ResourceLoader.loadInHead({ url: '/app.js', type: 'js' });
    assert.deepEqual(await Promise.all([first, second]), [true, true]);
    assert.equal(appended.length, 1);
    assert.equal(appended[0].attributes.get('nonce'), 'test-nonce');
    assert.equal(appended[0].attributes.get('src'), '/app.js');
    assert.equal(await ResourceLoader.loadInHead('/app.js'), true);
    assert.equal(appended.length, 1);
});

test('ResourceLoader.loadInHead currently caches a failed stylesheet as loaded', async () => {
    class FakeLink {
        listeners = new Map();
        attributes = new Map();
        addEventListener(type, callback) { this.listeners.set(type, callback); }
        setAttribute(name, value) {
            this.attributes.set(name, value);
            if(name === 'href') queueMicrotask(() => this.listeners.get('error')?.());
        }
    }
    const appended = [];
    const document = {
        createElement: () => new FakeLink(), querySelector: () => null,
        head: { appendChild(tag) { appended.push(tag); } },
    };
    const { ResourceLoader } = loadRuntime({ document, HTMLLinkElement: FakeLink });
    assert.equal(await ResourceLoader.loadInHead({ url: '/missing.css', type: 'css' }), false);
    assert.equal(await ResourceLoader.loadInHead({ url: '/missing.css', type: 'css' }), true);
    assert.equal(appended.length, 1);
});

test('ResourceLoader loads an image blob as a data URL and caches it', async () => {
    const calls = [];
    class FakeReader {
        readAsDataURL(blob) {
            this.result = `data:image/png;base64,${blob.size}`;
            queueMicrotask(() => this.onloadend?.());
        }
    }
    const { ResourceLoader } = loadRuntime({
        FileReader: FakeReader,
        fetch: async (url, options) => {
            calls.push([url, options.headers.responseType]);
            return { async blob() { return new Blob(['png']); } };
        },
    });
    assert.equal(await ResourceLoader.load('/icon.png'), 'data:image/png;base64,3');
    assert.equal(await ResourceLoader.load('/icon.png'), 'data:image/png;base64,3');
    assert.deepEqual(calls, [['/icon.png', 'blob']]);
});

test('ResourceLoader.loadInHead recognizes a stylesheet already present in the DOM', async () => {
    let creates = 0;
    const document = {
        createElement() { creates++; return { setAttribute() {} }; },
        querySelector(selector) { return selector === 'link[rel="stylesheet"][href="/ready.css"]' ? {} : null; },
    };
    const { ResourceLoader } = loadRuntime({ document });
    assert.equal(await ResourceLoader.loadInHead('/ready.css'), true);
    assert.equal(await ResourceLoader.loadInHead('/ready.css'), true);
    assert.equal(creates, 1);
});

test('ResourceLoader replaces an HTML response for an image with empty content', async () => {
    const errors = [];
    class FakeReader {
        readAsDataURL() {
            this.result = 'data:text/html;base64,PGh0bWw+';
            queueMicrotask(() => this.onloadend?.());
        }
    }
    const { ResourceLoader } = loadRuntime({
        console: { error: message => errors.push(message) },
        FileReader: FakeReader,
        fetch: async () => ({ async blob() { return new Blob(['<html>']); } }),
    });
    assert.equal(await ResourceLoader.load('/broken.png'), '');
    assert.deepEqual(errors, ["Can't load img /broken.png"]);
});
