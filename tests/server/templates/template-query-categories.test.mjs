import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ TemplateManager, NoTemplatesAvailableError }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

function template(allowed, calls) {
    const script = Object.create(TemplateScript.prototype);
    script.description = allowed ? 'Visible template' : 'Unavailable template';
    script.isAllowed = async (...args) => {
        calls.push(args);
        return allowed;
    };
    return script;
}

test('nested template query sorts categories and filters disallowed leaves at each level', async () => {
    const manager = Object.create(TemplateManager.prototype);
    manager.workspaces = ['D:\\workspace'];
    const checks = [];
    const shown = [];
    const allowed = template(true, checks);
    const denied = template(false, checks);
    const previous = GenericServer.instance;
    GenericServer.instance = { connection: { Select: async items => {
        shown.push(items.map(item => item.label));
        return items.find(item => item.label === (shown.length === 1 ? 'Group' : 'Allowed'));
    } } };
    try {
        const chosen = await manager.query('D:\\workspace\\src', {
            Zed: denied,
            Group: { Denied: denied, Allowed: allowed },
            Alpha: allowed,
        });
        assert.equal(chosen, allowed);
        assert.deepEqual(shown, [['Alpha', 'Group'], ['Allowed']]);
        assert.deepEqual(checks, Array(4).fill(['D:\\workspace\\src', 'D:\\workspace']));
    } finally {
        GenericServer.instance = previous;
    }
});

test('category containing only disallowed templates is hidden', async () => {
    const manager = Object.create(TemplateManager.prototype);
    manager.workspaces = ['D:\\workspace'];
    const checks = [];
    const shown = [];
    const warnings = [];
    const previous = GenericServer.instance;
    GenericServer.instance = { connection: { Select: async items => {
        shown.push(items.map(item => item.label));
        return items[0] ?? null;
    }, showWarningMessage: message => warnings.push(message) } };
    try {
        await assert.rejects(manager.query('D:\\workspace\\src', {
            Empty: { Nested: { Denied: template(false, checks) } },
        }), NoTemplatesAvailableError);
        assert.deepEqual(shown, []);
        assert.deepEqual(warnings, []);
        assert.deepEqual(checks, [['D:\\workspace\\src', 'D:\\workspace']]);
    } finally {
        GenericServer.instance = previous;
    }
});
