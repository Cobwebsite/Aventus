import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { loadRuntime, loadRuntimeContext } from './helpers/load-runtime.mjs';

test('Effect switches signal dependencies when a condition changes and stops after destroy', () => {
    const { Effect, Signal } = loadRuntime();
    const select = new Signal(true);
    const left = new Signal('left');
    const right = new Signal('right');
    const seen = [];
    const effect = new Effect(() => seen.push(select.value ? left.value : right.value));
    assert.deepEqual(seen, ['left']);
    left.value = 'LEFT';
    select.value = false;
    left.value = 'ignored';
    right.value = 'RIGHT';
    assert.deepEqual(seen, ['left', 'LEFT', 'right', 'RIGHT']);
    effect.destroy();
    right.value = 'ignored';
    assert.deepEqual(seen, ['left', 'LEFT', 'right', 'RIGHT']);
});

test('Computed evaluates lazily, recomputes on a relevant change and notifies only when value changes', () => {
    const { Computed, Signal } = loadRuntime();
    const source = new Signal(1);
    let evaluations = 0;
    const parity = new Computed(() => { evaluations++; return source.value % 2; });
    assert.equal(evaluations, 0);
    assert.equal(parity.value, 1);
    assert.equal(parity.value, 1);
    assert.equal(evaluations, 1);
    let notifications = 0;
    parity.subscribe(() => notifications++);
    source.value = 3;
    assert.equal(parity.value, 1);
    assert.equal(notifications, 0);
    source.value = 4;
    assert.equal(parity.value, 0);
    assert.equal(notifications, 1);
    parity.destroy();
    source.value = 5;
    assert.equal(notifications, 1);
});

test('Watcher.untrack avoids registering a secondary signal as an effect dependency', () => {
    const { Effect, Signal, Watcher } = loadRuntime();
    const primary = new Signal(1);
    const secondary = new Signal(10);
    const seen = [];
    const effect = new Effect(() => seen.push(primary.value + Watcher.untrack(() => secondary.value)));
    secondary.value = 20;
    assert.deepEqual(seen, [11]);
    primary.value = 2;
    assert.deepEqual(seen, [11, 22]);
    effect.destroy();
});

test('Watcher reports creation, updates and deletion for objects from its own realm', () => {
    const context = loadRuntimeContext();
    const { Watcher, WatchAction } = context.Aventus;
    const changes = [];
    const data = runInNewContext('({ child: { count: 1 } })', context);
    const model = Watcher.get(data, (action, path, value) => {
        changes.push([action, path, value]);
    });
    assert.equal(Watcher.is(model), true);
    model.child.count = 2;
    model.extra = 'added';
    delete model.extra;
    assert.deepEqual(changes.map(([action, path]) => [action, path]), [
        [WatchAction.UPDATED, 'child.count'],
        [WatchAction.CREATED, 'extra'],
        [WatchAction.DELETED, 'extra'],
    ]);
    assert.equal(Watcher.extract(model).child.count, 2);
});

test('Watcher tracks array edits and replacement of a nested object', () => {
    const context = loadRuntimeContext();
    const { Watcher, WatchAction } = context.Aventus;
    const changes = [];
    const data = runInNewContext('({ items: [1], child: { count: 1 } })', context);
    const model = Watcher.get(data, (action, path) => changes.push([action, path]));
    model.items.push(2);
    model.child = runInNewContext('({ count: 5 })', context);
    model.child.count = 6;
    assert.deepEqual(Array.from(model.items), [1, 2]);
    assert.equal(model.child.count, 6);
    assert.deepEqual(changes, [
        [WatchAction.CREATED, 'items[1]'],
        [WatchAction.UPDATED, 'items.length'],
        [WatchAction.UPDATED, 'child'],
        [WatchAction.UPDATED, 'child.count'],
    ]);
});

test('Watcher.find returns a watched item whose changes notify subscribers', () => {
    const context = loadRuntimeContext();
    const { Watcher, WatchAction } = context.Aventus;
    const changes = [];
    const model = Watcher.get(runInNewContext('({ items: [{ id: 1, name: "first" }, { id: 2, name: "second" }] })', context),
        (action, path) => changes.push([action, path]));
    const found = model.items.find(item => item.id === 2);
    assert.equal(Watcher.is(found), true);
    found.name = 'updated';
    assert.deepEqual(changes, [[WatchAction.UPDATED, 'items[1].name']]);
    assert.equal(model.items[1].name, 'updated');
});

test('Watcher.at and findLast return watched items', () => {
    const context = loadRuntimeContext();
    const { Watcher, WatchAction } = context.Aventus;
    const changes = [];
    const model = Watcher.get(runInNewContext('({ items: [{ id: 1, name: "first" }, { id: 2, name: "second" }] })', context),
        (action, path) => changes.push([action, path]));

    const last = model.items.at(-1);
    assert.equal(Watcher.is(last), true);
    last.name = 'from at';

    const found = model.items.findLast(item => item.id === 1);
    assert.equal(Watcher.is(found), true);
    found.name = 'from findLast';

    assert.deepEqual(changes, [
        [WatchAction.UPDATED, 'items[1].name'],
        [WatchAction.UPDATED, 'items[0].name'],
    ]);
});

test('Watcher values and entries iterate watched items', () => {
    const context = loadRuntimeContext();
    const { Watcher, WatchAction } = context.Aventus;
    const changes = [];
    const model = Watcher.get(runInNewContext('({ items: [{ count: 1 }, { count: 2 }] })', context),
        (action, path) => changes.push([action, path]));

    const values = Array.from(model.items.values());
    assert.equal(Watcher.is(values[0]), true);
    values[0].count = 3;

    const entries = Array.from(model.items.entries());
    assert.deepEqual(entries.map(([index]) => index), [0, 1]);
    assert.equal(Watcher.is(entries[1][1]), true);
    entries[1][1].count = 4;

    assert.deepEqual(changes, [
        [WatchAction.UPDATED, 'items[0].count'],
        [WatchAction.UPDATED, 'items[1].count'],
    ]);
});

test('Watcher array callbacks receive watched items', () => {
    const context = loadRuntimeContext();
    const { Watcher, Effect, WatchAction } = context.Aventus;
    const changes = [];
    const model = Watcher.get(runInNewContext('({ items: [{ count: 1 }, { count: 2 }] })', context),
        (action, path) => changes.push([action, path]));
    const methods = ['findIndex', 'findLastIndex', 'some', 'every', 'filter', 'map', 'flatMap', 'forEach'];

    for(const method of methods) {
        const received = [];
        model.items[method](item => {
            received.push(Watcher.is(item) === true);
            return method === 'every' ? true : false;
        });
        assert.equal(received.every(Boolean), true, method);
    }

    for(const method of ['reduce', 'reduceRight']) {
        const received = [];
        model.items[method]((total, item) => {
            received.push(Watcher.is(item) === true);
            return total + item.count;
        }, 0);
        assert.deepEqual(received, [true, true], method);
    }

    const seen = [];
    const effect = new Effect(() => seen.push(model.items.some(item => item.count > 2)));
    model.items.forEach(item => { if(item.count === 2) item.count = 3; });
    assert.deepEqual(seen, [false, true]);
    model.items[1].count = 2;
    assert.deepEqual(seen, [false, true, false]);
    assert.deepEqual(changes, [
        [WatchAction.UPDATED, 'items[1].count'],
        [WatchAction.UPDATED, 'items[1].count'],
    ]);
    effect.destroy();
});

test('Watcher array indexOf accepts a plain value and a watched item', () => {
    const context = loadRuntimeContext();
    const { Watcher } = context.Aventus;
    const plain = runInNewContext('({ id: 1 })', context);
    const model = Watcher.get(runInNewContext('({ items: [] })', context));
    model.items.push(plain);

    assert.equal(model.items.indexOf(plain), 0);
    assert.equal(model.items.indexOf(model.items[0]), 0);
    assert.equal(model.items.indexOf(runInNewContext('({ id: 1 })', context)), -1);
});

test('Watcher array includes and lastIndexOf accept a watched item', () => {
    const context = loadRuntimeContext();
    const { Watcher } = context.Aventus;
    const plain = runInNewContext('({ id: 1 })', context);
    const model = Watcher.get(runInNewContext('({ items: [] })', context));
    model.items.push(plain);
    model.items.push(plain);

    assert.equal(model.items.includes(plain), true);
    assert.equal(model.items.includes(model.items[0]), true);
    assert.equal(model.items.lastIndexOf(plain), 1);
    assert.equal(model.items.lastIndexOf(model.items[0]), 1);
});

test('Watcher subscriptions can be removed and extraction returns current plain data', () => {
    const context = loadRuntimeContext();
    const { Watcher } = context.Aventus;
    const model = Watcher.get(runInNewContext('({ value: 1 })', context));
    const paths = [];
    const callback = (_action, path) => paths.push(path);
    model.subscribe(callback);
    model.value = 2;
    model.unsubscribe(callback);
    model.value = 3;
    assert.deepEqual(paths, ['value']);
    const plain = Watcher.extract(model);
    assert.notEqual(Watcher.is(plain), true);
    assert.equal(plain.value, 3);
});

test('Watcher.clearHistory clears on invocation rather than property access', () => {
    const context = loadRuntimeContext();
    const { Watcher } = context.Aventus;
    const model = Watcher.get(runInNewContext('({ value: 1 })', context));
    model.enableHistory();
    model.value = 2;
    const clear = model.clearHistory;
    assert.equal(typeof clear, 'function');
    assert.equal(model.getHistory().length, 1);
    clear();
    assert.equal(model.getHistory().length, 0);
});

test('Watcher notifies the whole array after reordering and extracts the final order', () => {
    const context = loadRuntimeContext();
    const { Watcher, WatchAction } = context.Aventus;
    const changes = [];
    const model = Watcher.get(runInNewContext('({ items: [3, 1, 2] })', context),
        (action, path) => changes.push([action, path]));
    model.items.splice(1, 1);
    model.items.reverse();
    assert.deepEqual(Array.from(model.items), [2, 3]);
    assert.deepEqual(Array.from(Watcher.extract(model).items), [2, 3]);
    assert.equal(changes.some(([, path]) => path === 'items[1]'), true);
    assert.equal(changes.some(([, path]) => path === 'items.length'), true);
    assert.deepEqual(changes.filter(([, path]) => path === 'items'), [[WatchAction.UPDATED, 'items']]);
});

test('Watcher does not report edits on a replaced child', () => {
    const context = loadRuntimeContext();
    const { Watcher, WatchAction } = context.Aventus;
    const paths = [];
    const model = Watcher.get(runInNewContext('({ child: { count: 1 } })', context),
        (action, path) => paths.push([action, path]));
    const detached = model.child;
    model.child = runInNewContext('({ count: 2 })', context);
    model.child.count = 3;
    detached.count = 4;
    assert.equal(Watcher.extract(model).child.count, 3);
    assert.deepEqual(paths, [
        [WatchAction.UPDATED, 'child'],
        [WatchAction.UPDATED, 'child.count'],
    ]);
});

test('Watcher does not report edits on a deleted child', () => {
    const context = loadRuntimeContext();
    const { Watcher, WatchAction } = context.Aventus;
    const paths = [];
    const model = Watcher.get(runInNewContext('({ child: { count: 1 } })', context),
        (action, path) => paths.push([action, path]));
    const detached = model.child;
    delete model.child;
    detached.count = 2;
    assert.equal(Object.hasOwn(Watcher.extract(model), 'child'), false);
    assert.deepEqual(paths, [
        [WatchAction.DELETED, 'child'],
    ]);
});

test('Watcher propagates changes through an alias to a second root proxy', () => {
    const context = loadRuntimeContext();
    const { Watcher } = context.Aventus;
    const sourcePaths = [];
    const targetPaths = [];
    const source = Watcher.get(runInNewContext('({ child: { count: 1 } })', context),
        (_action, path) => sourcePaths.push(path));
    const target = Watcher.get(runInNewContext('({ alias: null })', context),
        (_action, path) => targetPaths.push(path));
    target.alias = source.child;
    source.child.count = 2;
    assert.equal(target.alias.count, 2);
    assert.equal(Watcher.extract(target).alias.count, 2);
    assert.equal(sourcePaths.includes('child.count'), true);
    assert.equal(targetPaths.includes('alias.count'), true);
});

test('Watcher forwards changes across a chain of injected proxies and stops at a replaced link', () => {
    const context = loadRuntimeContext();
    const { Watcher } = context.Aventus;
    const make = source => runInNewContext(source, context);
    const sourcePaths = [];
    const middlePaths = [];
    const targetPaths = [];
    const source = Watcher.get(make('({ child: { count: 1 } })'), (_action, path) => sourcePaths.push(path));
    const middle = Watcher.get(make('({ nested: null })'), (_action, path) => middlePaths.push(path));
    const target = Watcher.get(make('({ nested: null })'), (_action, path) => targetPaths.push(path));
    middle.nested = source.child;
    target.nested = middle.nested;
    source.child.count = 2;
    assert.equal(target.nested.count, 2);
    assert.equal(Watcher.extract(target).nested.count, 2);
    assert.equal(sourcePaths.includes('child.count'), true);
    assert.equal(middlePaths.includes('nested.count'), true);
    assert.equal(targetPaths.includes('nested.count'), true);
    target.nested = make('({ count: 10 })');
    const before = targetPaths.length;
    source.child.count = 3;
    assert.equal(target.nested.count, 10);
    assert.equal(targetPaths.length, before);
    assert.equal(middle.nested.count, 3);
});

test('Watcher stops forwarding alias changes after the target removes the alias', () => {
    const context = loadRuntimeContext();
    const { Watcher } = context.Aventus;
    const paths = [];
    const source = Watcher.get(runInNewContext('({ child: { count: 1 } })', context));
    const target = Watcher.get(runInNewContext('({ alias: null })', context),
        (_action, path) => paths.push(path));
    target.alias = source.child;
    target.alias = null;
    const before = paths.length;
    source.child.count = 2;
    assert.equal(target.alias, null);
    assert.equal(paths.length, before);
});

test('Watcher reports every live path to a shared child', () => {
    const context = loadRuntimeContext();
    const { Watcher } = context.Aventus;
    const paths = [];
    const data = runInNewContext('(() => { const shared = { count: 1 }; return { left: shared, right: shared }; })()', context);
    const model = Watcher.get(data, (_action, path) => paths.push(path));
    model.left.count = 2;
    assert.equal(model.right.count, 2);
    const extracted = Watcher.extract(model);
    assert.equal(extracted.left.count, 2);
    assert.equal(extracted.right.count, 2);
    assert.deepEqual(paths, ['left.count', 'right.count']);
    model.right.count = 3;
    assert.equal(model.left.count, 3);
    assert.deepEqual(paths, ['left.count', 'right.count', 'right.count', 'left.count']);
    delete model.left;
    model.right.count = 4;
    assert.equal(Watcher.extract(model).right.count, 4);
    assert.deepEqual(paths.slice(-2), ['left', 'right.count']);
});

test('EffectNoRecomputed runs once while ComputedNoRecomputed refreshes a fixed dependency', () => {
    const { Signal, EffectNoRecomputed, ComputedNoRecomputed } = loadRuntime();
    const source = new Signal(1);
    let effectRuns = 0;
    const effect = new EffectNoRecomputed(() => { effectRuns++; void source.value; });
    assert.equal(effectRuns, 1);
    source.value = 2;
    assert.equal(effectRuns, 1);
    effect.destroy();

    let computedRuns = 0;
    const computed = new ComputedNoRecomputed(() => { computedRuns++; return source.value * 2; });
    assert.equal(computed.value, 4);
    source.value = 3;
    assert.equal(computed.value, 6);
    assert.equal(computedRuns, 2);
    computed.destroy();
});

test('nested Computed and Effect propagate signal changes through both levels', () => {
    const { Signal, Computed, Effect } = loadRuntime();
    const source = new Signal(2);
    const doubled = new Computed(() => source.value * 2);
    const seen = [];
    const effect = new Effect(() => seen.push(doubled.value + 1));
    assert.deepEqual(seen, [5]);
    source.value = 3;
    assert.deepEqual(seen, [5, 7]);
    effect.destroy();
    doubled.destroy();
    source.value = 4;
    assert.deepEqual(seen, [5, 7]);
});

test('Effect reruns after a signal changes during its callback', () => {
    const { Signal, Effect } = loadRuntime();
    const source = new Signal(0);
    const seen = [];
    const effect = new Effect(() => {
        const value = source.value;
        seen.push(value);
        if(value === 0) source.value = 1;
    });
    assert.deepEqual(seen, [0, 1]);
    assert.equal(source.value, 1);
    source.value = 2;
    assert.deepEqual(seen, [0, 1, 2]);
    effect.destroy();
});

test('Effect can run again after its callback throws on a signal change', () => {
    const { Signal, Effect } = loadRuntime();
    const source = new Signal(0);
    const seen = [];
    const effect = new Effect(() => {
        const value = source.value;
        seen.push(value);
        if(value === 1) throw new Error('effect failed');
    });
    assert.throws(() => { source.value = 1; }, /effect failed/);
    source.value = 2;
    assert.deepEqual(seen, [0, 1, 2]);
    effect.destroy();
});

test('Computed retains its previous value when recomputation throws and recovers later', () => {
    const { Signal, Computed } = loadRuntime();
    const source = new Signal(0);
    const computed = new Computed(() => {
        if(source.value === 1) throw new Error('computed failed');
        return source.value * 2;
    });
    assert.equal(computed.value, 0);
    assert.throws(() => { source.value = 1; }, /computed failed/);
    assert.equal(computed.value, 0);
    source.value = 2;
    assert.equal(computed.value, 4);
    computed.destroy();
});
