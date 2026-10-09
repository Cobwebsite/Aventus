import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

function script(allowed) {
    const value = Object.create(TemplateScript.prototype);
    value.description = allowed ? 'Allowed' : 'Hidden';
    value.isAllowed = async () => allowed;
    return value;
}

test('template query keeps a custom choice and returns it after filtering disallowed templates', async () => {
    const manager = Object.create(TemplateManager.prototype);
    manager.workspaces = ['D:\\project'];
    const previous = GenericServer.instance;
    const visible = script(true);
    const hidden = script(false);
    const calls = [];
    GenericServer.instance = { connection: { Select: async (items, options) => {
        calls.push({ items: items.map(item => item.label), title: options.title });
        return items.find(item => item.label === 'Custom');
    } } };
    try {
        const selected = await manager.query('D:\\project\\src', { Hidden: hidden, Visible: visible }, [{ label: 'Custom' }]);
        assert.deepEqual(selected, { label: 'Custom' });
        assert.deepEqual(calls, [{ items: ['Custom', 'Visible'], title: 'What do you want to create?' }]);
    } finally {
        GenericServer.instance = previous;
    }
});

test('template query cancellation in a nested category returns null', async () => {
    const manager = Object.create(TemplateManager.prototype);
    manager.workspaces = ['D:\\project'];
    const previous = GenericServer.instance;
    const calls = [];
    GenericServer.instance = { connection: { Select: async items => {
        calls.push(items.map(item => item.label));
        return calls.length === 1 ? items.find(item => item.label === 'Group') : null;
    } } };
    try {
        const selected = await manager.query('D:\\project\\src', { Group: { Item: script(true) } });
        assert.equal(selected, null);
        assert.deepEqual(calls, [['Group'], ['Item']]);
    } finally {
        GenericServer.instance = previous;
    }
});
