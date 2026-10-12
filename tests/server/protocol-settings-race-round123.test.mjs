import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GenericServer }, { SettingsManager }] = await loadServerModules([
    'GenericServer.ts', 'settings/Settings.ts',
]);

test('older configuration response can overwrite a newer notification when client replies arrive out of order', async t => {
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    t.after(() => {
        GenericServer.instance = oldServer;
        SettingsManager.instance = oldSettings;
    });

    const handlers = {};
    const pending = [];
    const applied = [];
    const connection = new Proxy({
        getSettings: () => new Promise(resolve => pending.push(resolve)),
        getSettingsHtml: async () => ({ customData: [] }),
    }, {
        get(target, key) {
            if (key in target) return target[key];
            if (String(key).startsWith('on')) return cb => { handlers[key] = cb; };
        },
    });
    const server = new GenericServer(connection);
    Object.defineProperty(server, 'logLevel', { value: 99 });
    SettingsManager.instance = {
        initSettings: value => applied.push(value.logLevel),
        setSettingsHtml: () => {},
    };

    await handlers.onDidChangeConfiguration();
    await handlers.onDidChangeConfiguration();
    assert.equal(pending.length, 2);
    pending[1]({ logLevel: 1 });
    await new Promise(resolve => setImmediate(resolve));
    pending[0]({ logLevel: 4 });
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(applied, [1, 4]);
});
