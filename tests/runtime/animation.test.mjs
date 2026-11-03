import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

function animationHarness() {
    let now = 0;
    let nextId = 0;
    const frames = new Map();
    const timers = [];
    const { Animation } = loadRuntime({
        window: { performance: { now: () => now } },
        requestAnimationFrame(callback) { const id = ++nextId; frames.set(id, callback); return id; },
        cancelAnimationFrame(id) { frames.delete(id); },
        setTimeout(callback) { timers.push(callback); },
    });
    return {
        Animation, frames, timers,
        tick(time) {
            now = time;
            const callbacks = [...frames.values()];
            frames.clear();
            callbacks.forEach(callback => callback());
            while(timers.length) timers.shift()();
        },
    };
}

test('Animation schedules frames at its FPS and stops after the next frame', () => {
    const harness = animationHarness();
    const calls = [];
    const animation = new harness.Animation({ fps: 50, animate: () => calls.push('animate'), stopped: () => calls.push('stopped') });
    animation.start();
    assert.equal(animation.isStarted(), true);
    harness.tick(10);
    assert.deepEqual(calls, []);
    harness.tick(25);
    assert.deepEqual(calls, ['animate']);
    animation.stop();
    harness.tick(50);
    assert.deepEqual(calls, ['animate', 'animate', 'stopped']);
    assert.equal(animation.isStarted(), false);
    assert.equal(harness.frames.size, 0);
});

test('Animation immediateStop cancels a scheduled frame and exposes an updated FPS', () => {
    const harness = animationHarness();
    const calls = [];
    const animation = new harness.Animation({ stopped: () => calls.push('stopped') });
    assert.equal(animation.getFPS(), 60);
    animation.setFPS(30);
    assert.equal(animation.getFPS(), 30);
    animation.start();
    assert.equal(harness.frames.size, 1);
    animation.immediateStop();
    assert.equal(animation.isStarted(), false);
    assert.equal(harness.frames.size, 0);
    assert.deepEqual(calls, ['stopped']);
});
