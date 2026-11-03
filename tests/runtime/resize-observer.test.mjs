import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

function resizeHarness() {
    const timers = [];
    const frames = [];
    let now = 100;
    let native;
    class NativeObserver {
        observed = new Set();
        constructor(callback) { this.callback = callback; native = this; }
        observe(target) { this.observed.add(target); }
        unobserve(target) { this.observed.delete(target); }
        emit(entries) { this.callback(entries); }
    }
    const { ResizeObserver } = loadRuntime({
        window: { ResizeObserver: NativeObserver, performance: { now: () => now } },
        setTimeout(callback) { timers.push(callback); },
        requestAnimationFrame(callback) { frames.push(callback); },
    });
    return {
        ResizeObserver, get native() { return native; },
        setTime(value) { now = value; },
        flushFrame() { const callbacks = frames.splice(0); callbacks.forEach(callback => callback()); },
        get pendingFrames() { return frames.length; },
        flush() { while(timers.length) timers.shift()(); },
    };
}

test('ResizeObserver shares one native observer and delivers each subscribed target', () => {
    const harness = resizeHarness();
    const firstTarget = {};
    const secondTarget = {};
    const received = [];
    const first = new harness.ResizeObserver({ callback: entries => received.push(['first', ...entries.map(entry => entry.target)]) });
    const second = new harness.ResizeObserver({ callback: entries => received.push(['second', ...entries.map(entry => entry.target)]) });
    first.observe(firstTarget);
    second.observe(secondTarget);
    assert.equal(harness.native.observed.size, 2);
    harness.native.emit([{ target: firstTarget }, { target: secondTarget }]);
    harness.flush();
    assert.deepEqual(received, [['first', firstTarget], ['second', secondTarget]]);
    first.disconnect();
    second.disconnect();
    assert.equal(harness.native.observed.size, 0);
});

test('ResizeObserver unobserve prevents later delivery', () => {
    const harness = resizeHarness();
    const target = {};
    let calls = 0;
    const observer = new harness.ResizeObserver({ callback: () => calls++ });
    observer.observe(target);
    observer.unobserve(target);
    harness.native.emit([{ target }]);
    harness.flush();
    assert.equal(calls, 0);
    assert.equal(harness.native.observed.size, 0);
});

test('ResizeObserver keeps a shared target observed until its last wrapper disconnects', () => {
    const harness = resizeHarness();
    const target = {};
    const received = [];
    const first = new harness.ResizeObserver({ callback: () => received.push('first') });
    const second = new harness.ResizeObserver({ callback: () => received.push('second') });
    first.observe(target);
    second.observe(target);
    second.observe(target);
    assert.equal(harness.native.observed.has(target), true);
    first.disconnect();
    assert.equal(harness.native.observed.has(target), true);
    harness.native.emit([{ target }]);
    harness.flush();
    assert.deepEqual(received, ['second']);
    second.disconnect();
    assert.equal(harness.native.observed.has(target), false);
});

test('ResizeObserver delays callbacks until its FPS interval has elapsed', () => {
    const harness = resizeHarness();
    harness.setTime(0);
    const target = {};
    const received = [];
    const observer = new harness.ResizeObserver({ fps: 50, callback: entries => received.push(entries[0].target) });
    observer.observe(target);
    harness.native.emit([{ target }]);
    harness.flush();
    assert.deepEqual(received, []);
    assert.equal(harness.pendingFrames, 1);
    harness.setTime(25);
    harness.flushFrame();
    harness.flush();
    assert.deepEqual(received, [target]);
    observer.disconnect();
});
