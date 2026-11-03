import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('StateManager activates matching routes, exposes slugs and cleans subscriptions', async () => {
    const { StateManager } = loadRuntime();
    const manager = new (class extends StateManager {})();
    const events = [];
    const callbacks = {
        active: (state, slugs) => events.push(['active', state.name, slugs.id]),
        inactive: (state, next, slugs) => events.push(['inactive', state.name, next.name, slugs.id]),
    };
    manager.subscribe('/items/{id:number}', callbacks);
    assert.equal(await manager.setState('/items/4'), true);
    assert.equal(manager.isStateActive('/items/{id:number}'), true);
    assert.equal(manager.getStateSlugs('/items/{id:number}').id, 4);
    assert.equal(await manager.setState('/other'), true);
    assert.equal(manager.isStateActive('/items/{id:number}'), false);
    manager.unsubscribe('/items/{id:number}', callbacks);
    assert.equal(await manager.setState('/items/5'), true);
    assert.deepEqual(events, [
        ['active', '/items/4', 4],
        ['inactive', '/items/4', '/other', 4],
    ]);
});

test('StateManager veto leaves current state active and permits a later transition', async () => {
    const { StateManager } = loadRuntime();
    const manager = new (class extends StateManager {})();
    let permit = false;
    manager.canChangeState(async () => permit);
    assert.equal(await manager.setState('blocked'), false);
    assert.equal(manager.getState(), undefined);
    permit = true;
    assert.equal(await manager.setState('allowed'), true);
    assert.equal(manager.getState().name, 'allowed');
});

test('State hooks run on accepted transitions and active-state veto keeps prior state', async () => {
    const { StateManager, State } = loadRuntime();
    const manager = new (class extends StateManager {})();
    const events = [];
    let allow = false;
    manager.onAfterStateChanged(() => events.push('changed'));
    class Tracked extends State {
        get name() { return 'tracked'; }
        onActivate() { events.push('activate'); }
        onInactivate(next) { events.push(`inactive:${next.name}`); }
        async askChange() { events.push('ask'); return allow; }
    }
    await manager.setState(new Tracked());
    assert.equal(await manager.setState('next'), false);
    assert.equal(manager.getState().name, 'tracked');
    assert.deepEqual(events, ['activate', 'changed', 'ask']);
    allow = true;
    assert.equal(await manager.setState('next'), true);
    assert.equal(manager.getState().name, 'next');
    assert.deepEqual(events, ['activate', 'changed', 'ask', 'ask', 'inactive:next', 'changed']);
});

test('StateManager keeps only the last queued transition while an earlier one is active', async () => {
    const { StateManager } = loadRuntime();
    const manager = new (class extends StateManager {})();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    manager.canChangeState(async state => {
        if(state.name === 'first') await gate;
        return true;
    });
    const first = manager.setState('first');
    const middle = manager.setState('middle');
    const last = manager.setState('last');
    release();
    assert.deepEqual(await Promise.all([first, middle, last]), [true, false, true]);
    assert.equal(manager.getState().name, 'last');
});

test('StateManager queues a transition requested from an activation callback', async () => {
    const { StateManager } = loadRuntime();
    const manager = new (class extends StateManager {})();
    const events = [];
    let followup;
    manager.subscribe('first', { active() {
        events.push('first');
        followup = manager.setState('second');
    } });
    manager.subscribe('second', { active() { events.push('second'); } });
    assert.equal(await manager.setState('first'), true);
    assert.equal(await followup, true);
    assert.equal(manager.getState().name, 'second');
    assert.deepEqual(events, ['first', 'second']);
});

test('StateManager completes a transition after a failing activation hook', async () => {
    const { StateManager, State } = loadRuntime();
    const manager = new (class extends StateManager {})();
    class Failing extends State {
        get name() { return 'failing'; }
        onActivate() { throw new Error('activation failed'); }
    }
    const errors = [];
    const notifications = [];
    manager.onAfterStateChanged(() => notifications.push(manager.getState().name));
    const original = console.error;
    console.error = error => errors.push(error.message);
    try {
        assert.equal(await manager.setState(new Failing()), true);
        assert.equal(manager.getState().name, 'failing');
        assert.deepEqual(errors, ['activation failed']);
        assert.equal(await manager.setState('recovered'), true);
        assert.equal(manager.getState().name, 'recovered');
        assert.deepEqual(notifications, ['failing', 'recovered']);
    } finally {
        console.error = original;
    }
});

test('StateManager completes a transition after a failing inactivation hook', async () => {
    const { StateManager, State } = loadRuntime();
    const manager = new (class extends StateManager {})();
    class Failing extends State {
        get name() { return 'old'; }
        onInactivate() { throw new Error('inactivation failed'); }
    }
    await manager.setState(new Failing());
    const errors = [];
    const notifications = [];
    manager.onAfterStateChanged(() => notifications.push(manager.getState().name));
    const original = console.error;
    console.error = error => errors.push(error.message);
    try {
        assert.equal(await manager.setState('new'), true);
        assert.equal(manager.getState().name, 'new');
        assert.deepEqual(errors, ['inactivation failed']);
        assert.deepEqual(notifications, ['new']);
    } finally {
        console.error = original;
    }
});
