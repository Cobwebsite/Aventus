import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

class FakeElement {
    style = {};
    listeners = new Map();
    offsetLeft = 0;
    offsetTop = 0;
    offsetWidth = 10;
    offsetHeight = 10;
    addEventListener(type, callback) { this.listeners.set(type, callback); }
    removeEventListener(type, callback) {
        if(this.listeners.get(type) === callback) this.listeners.delete(type);
    }
    dispatchEvent(event) { this.listeners.get(event.type)?.(event); return true; }
    getBoundingClientRect() {
        const x = Number.parseFloat(this.style.left) || this.offsetLeft;
        const y = Number.parseFloat(this.style.top) || this.offsetTop;
        return { x, y, left: x, top: y, width: this.offsetWidth, height: this.offsetHeight,
            right: x + this.offsetWidth, bottom: y + this.offsetHeight };
    }
}

class FakeCustomEvent {
    constructor(type, options) { this.type = type; this.detail = options.detail; }
}

test('DragAndDrop attaches to its trigger, updates targets and removes listeners on destroy', () => {
    const element = new FakeElement();
    const trigger = new FakeElement();
    const target = new FakeElement();
    const { DragAndDrop } = loadRuntime({ document: { body: { style: {} }, removeEventListener() {} } });
    const drag = new DragAndDrop({ element, elementTrigger: trigger, targets: [target] });
    assert.equal(trigger.style.touchAction, 'none');
    assert.equal(element.style.touchAction, undefined);
    assert.equal(trigger.listeners.has('pointerdown'), true);
    assert.equal(drag.getElementDrag(), element);
    drag.setTargets([]);
    drag.setTargetsFct(() => [target]);
    drag.destroy();
    assert.equal(trigger.listeners.size, 0);
});

test('DragAndDrop moves an element into a matching target and emits drop', () => {
    const element = new FakeElement();
    const target = new FakeElement();
    target.offsetLeft = 20;
    const document = new FakeElement();
    document.body = { style: {} };
    const calls = [];
    const { DragAndDrop } = loadRuntime({ document, HTMLElement: FakeElement,
        CustomEvent: FakeCustomEvent });
    const drag = new DragAndDrop({ element, targets: [target], offsetDrag: 5,
        onStart: () => calls.push('start'),
        onMove: (_event, position) => calls.push(`move:${position.x}`),
        onDrop: (_element, targets) => calls.push(`drop:${targets.length}`),
        onStop: () => calls.push('stop'),
    });
    const event = (type, x) => ({ type, pointerId: 1, pointerType: 'mouse', button: 0,
        pageX: x, clientX: x, pageY: 0, clientY: 0, stopImmediatePropagation() {} });
    element.dispatchEvent(event('pointerdown', 0));
    document.dispatchEvent(event('pointermove', 6));
    document.dispatchEvent(event('pointermove', 20));
    document.dispatchEvent(event('pointerup', 20));
    assert.equal(element.style.left, '20px');
    assert.deepEqual(calls, ['start', 'move:20', 'drop:1', 'stop']);
    assert.equal(document.listeners.size, 0);
    drag.destroy();
    assert.equal(element.listeners.size, 0);
});

test('DragAndDrop strict target matching requires full containment', () => {
    const run = strict => {
        const element = new FakeElement();
        const target = new FakeElement();
        target.offsetLeft = 20;
        const document = new FakeElement();
        document.body = { style: {} };
        let drops = 0;
        const { DragAndDrop } = loadRuntime({ document, HTMLElement: FakeElement,
            CustomEvent: FakeCustomEvent });
        const drag = new DragAndDrop({ element, targets: [target], offsetDrag: 5, strict,
            onDrop: () => drops++,
        });
        const event = (type, x) => ({ type, pointerId: 1, pointerType: 'mouse', button: 0,
            pageX: x, clientX: x, pageY: 0, clientY: 0, stopImmediatePropagation() {} });
        element.dispatchEvent(event('pointerdown', 0));
        document.dispatchEvent(event('pointermove', 6));
        document.dispatchEvent(event('pointermove', 15));
        document.dispatchEvent(event('pointerup', 15));
        assert.equal(document.listeners.size, 0);
        drag.destroy();
        return drops;
    };
    assert.equal(run(false), 1);
    assert.equal(run(true), 0);
});
