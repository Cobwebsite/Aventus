import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

class FakeTarget {
    listeners = new Map();
    addEventListener(type, callback) { this.listeners.set(type, callback); }
    removeEventListener(type, callback) {
        if(this.listeners.get(type) === callback) this.listeners.delete(type);
    }
    dispatchEvent(event) { this.listeners.get(event.type)?.(event); return true; }
}

class FakeCustomEvent {
    constructor(type, options) { this.type = type; this.detail = options.detail; }
}

test('PressManager installs and removes element listeners on destroy', () => {
    const element = new FakeTarget();
    const document = new FakeTarget();
    const { PressManager } = loadRuntime({ document });
    const press = new PressManager({ element });
    assert.equal(press.getElement(), element);
    assert.deepEqual([...element.listeners.keys()], [
        'pointerdown', 'touchstart', 'trigger_pointer_pressstart',
        'trigger_pointer_pressend', 'trigger_pointer_pressmove',
    ]);
    press.destroy();
    assert.equal(element.listeners.size, 0);
    assert.equal(document.listeners.size, 0);
});

test('PressManager.create returns one independently removable manager per element', () => {
    const first = new FakeTarget();
    const second = new FakeTarget();
    const { PressManager } = loadRuntime({ document: new FakeTarget() });
    const managers = PressManager.create({ element: [first, second] });
    assert.equal(managers.length, 2);
    assert.equal(managers[0].getElement(), first);
    assert.equal(managers[1].getElement(), second);
    managers[0].destroy();
    assert.equal(first.listeners.size, 0);
    assert.equal(second.listeners.size, 5);
    managers[1].destroy();
    assert.equal(second.listeners.size, 0);
});

test('PressManager reports a simple pointer press and releases document listeners', () => {
    const element = new FakeTarget();
    const document = new FakeTarget();
    const calls = [];
    const { PressManager } = loadRuntime({ document, CustomEvent: FakeCustomEvent });
    const manager = new PressManager({ element,
        onPressStart: () => calls.push('start'),
        onPress: () => calls.push('press'),
        onPressEnd: () => calls.push('end'),
    });
    const event = type => ({ type, pointerId: 1, pointerType: 'mouse', button: 0,
        pageX: 10, pageY: 20, clientX: 10, clientY: 20,
        stopImmediatePropagation() {},
    });
    element.dispatchEvent(event('pointerdown'));
    assert.equal(document.listeners.has('pointerup'), true);
    document.dispatchEvent(event('pointerup'));
    assert.deepEqual(calls, ['start', 'press', 'end']);
    assert.equal(document.listeners.size, 0);
    manager.destroy();
    assert.equal(element.listeners.size, 0);
});

test('PressManager starts dragging only after the configured distance and ends on pointerup', () => {
    const element = new FakeTarget();
    const document = new FakeTarget();
    const calls = [];
    const { PressManager } = loadRuntime({ document, CustomEvent: FakeCustomEvent });
    const manager = new PressManager({ element, offsetDrag: 5,
        onDragStart: () => calls.push('drag-start'),
        onDrag: () => calls.push('drag'),
        onDragEnd: () => calls.push('drag-end'),
        onPress: () => calls.push('press'),
    });
    const event = (type, x) => ({ type, pointerId: 1, pointerType: 'mouse', button: 0,
        pageX: x, pageY: 0, clientX: x, clientY: 0,
        stopImmediatePropagation() {},
    });
    element.dispatchEvent(event('pointerdown', 0));
    document.dispatchEvent(event('pointermove', 3));
    assert.deepEqual(calls, []);
    document.dispatchEvent(event('pointermove', 7));
    document.dispatchEvent(event('pointermove', 9));
    document.dispatchEvent(event('pointerup', 9));
    assert.deepEqual(calls, ['drag-start', 'drag', 'drag-end']);
    assert.equal(document.listeners.size, 0);
    manager.destroy();
});

test('PressManager cancels a simple press without firing its action', () => {
    const element = new FakeTarget();
    const document = new FakeTarget();
    const calls = [];
    const { PressManager } = loadRuntime({ document, CustomEvent: FakeCustomEvent });
    const manager = new PressManager({ element,
        onPressStart: () => calls.push('start'),
        onPress: () => calls.push('press'),
        onPressEnd: () => calls.push('end'),
    });
    const event = type => ({ type, pointerId: 7, pointerType: 'mouse', button: 0,
        pageX: 0, pageY: 0, clientX: 0, clientY: 0, stopImmediatePropagation() {} });
    element.dispatchEvent(event('pointerdown'));
    document.dispatchEvent(event('pointercancel'));
    assert.deepEqual(calls, ['start', 'end']);
    assert.equal(document.listeners.size, 0);
    manager.destroy();
});

test('PressManager cancels a drag without firing onDragEnd', () => {
    const element = new FakeTarget();
    const document = new FakeTarget();
    const calls = [];
    const { PressManager } = loadRuntime({ document, CustomEvent: FakeCustomEvent });
    const manager = new PressManager({ element, offsetDrag: 5,
        onDragStart: () => calls.push('drag-start'),
        onDragEnd: () => calls.push('drag-end'),
        onPressEnd: () => calls.push('end'),
    });
    const event = (type, x) => ({ type, pointerId: 1, pointerType: 'mouse', button: 0,
        pageX: x, pageY: 0, clientX: x, clientY: 0, stopImmediatePropagation() {} });
    element.dispatchEvent(event('pointerdown', 0));
    document.dispatchEvent(event('pointermove', 8));
    document.dispatchEvent(event('pointercancel', 8));
    assert.deepEqual(calls, ['drag-start', 'end']);
    assert.equal(document.listeners.size, 0);
    manager.destroy();
});

test('PressManager emits a double press before the single-press timer expires', () => {
    const element = new FakeTarget();
    const document = new FakeTarget();
    const timers = new Map();
    let nextTimer = 0;
    const calls = [];
    const { PressManager } = loadRuntime({ document, CustomEvent: FakeCustomEvent,
        setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, delay }); return id; },
        clearTimeout(id) { timers.delete(id); },
    });
    const manager = new PressManager({ element, delayDblPress: 200,
        onPress: () => calls.push('press'),
        onDblPress: () => calls.push('double'),
    });
    const event = type => ({ type, pointerId: 1, pointerType: 'mouse', button: 0,
        pageX: 0, pageY: 0, clientX: 0, clientY: 0, stopImmediatePropagation() {} });
    element.dispatchEvent(event('pointerdown'));
    document.dispatchEvent(event('pointerup'));
    assert.deepEqual(calls, []);
    assert.equal([...timers.values()].some(timer => timer.delay === 200), true);
    element.dispatchEvent(event('pointerdown'));
    document.dispatchEvent(event('pointerup'));
    assert.deepEqual(calls, ['double']);
    assert.equal(document.listeners.size, 0);
    manager.destroy();
});

test('PressManager handles a touchstart and touchend gesture', () => {
    class FakeTouch { constructor(identifier) { this.identifier = identifier; this.pageX = 5; this.pageY = 8; } }
    class FakeTouchEvent {
        constructor(type, touches, changedTouches = touches) {
            this.type = type;
            this.targetTouches = touches;
            this.changedTouches = changedTouches;
            this.touches = touches;
        }
        stopImmediatePropagation() {}
    }
    const element = new FakeTarget();
    const document = new FakeTarget();
    const calls = [];
    const { PressManager } = loadRuntime({ document, CustomEvent: FakeCustomEvent,
        Touch: FakeTouch, TouchEvent: FakeTouchEvent,
        window: { Touch: FakeTouch, TouchEvent: FakeTouchEvent },
        setTimeout: () => 1, clearTimeout() {},
    });
    const manager = new PressManager({ element,
        onPressStart: e => calls.push(`start:${e.pointerType}`),
        onPress: e => calls.push(`press:${e.pointerType}`),
        onPressEnd: e => calls.push(`end:${e.pointerType}`),
    });
    const touch = new FakeTouch(3);
    element.dispatchEvent(new FakeTouchEvent('touchstart', [touch]));
    document.dispatchEvent(new FakeTouchEvent('touchend', [], [touch]));
    assert.deepEqual(calls, ['start:touch', 'press:touch', 'end:touch']);
    assert.equal(document.listeners.size, 0);
    manager.destroy();
});
