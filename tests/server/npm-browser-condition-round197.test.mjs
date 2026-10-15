import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

function exportsOf(result) {
    const context = {};
    runInNewContext(result, context);
    return Object.values(context.npmCompilation)[0];
}

test('npm bundle selects browser import condition and production environment through import revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-browser-condition-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = previousServer; });

    const nodeModulesDir = join(root, 'node_modules');
    const packageDir = join(nodeModulesDir, 'browser-condition-fixture');
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({
        name: 'browser-condition-fixture', version: '1.0.0', type: 'module',
        exports: {
            '.': { browser: './browser.js', node: './node.js', default: './fallback.js' },
        },
    }));
    writeFileSync(join(packageDir, 'browser.js'), 'export const branch = "browser"; export const mode = process.env.NODE_ENV;\n');
    writeFileSync(join(packageDir, 'node.js'), 'export const branch = "node"; export const mode = "node";\n');
    writeFileSync(join(packageDir, 'fallback.js'), 'export const branch = "fallback"; export const mode = "fallback";\n');

    const builder = new NpmBuilder({ isBuildAllowed: true, nodeModulesDir, fullname: 'BrowserCondition' });
    const source = 'file:///browser-condition.lib.avt';
    assert.deepEqual(builder.register(source, { uri: 'browser-condition-fixture', libName: 'branch', alias: 'selected' }), []);
    const first = await builder.compile();
    assert.deepEqual(first.errors, []);
    assert.equal(exportsOf(first.result).selected, 'browser');

    builder.unregister(source);
    assert.deepEqual(builder.register(source, { uri: 'browser-condition-fixture', libName: 'mode', alias: 'environment' }), []);
    const second = await builder.compile();
    assert.deepEqual(second.errors, []);
    assert.equal(exportsOf(second.result).environment, 'production');
    assert.notEqual(second.result, first.result);

    builder.unregister(source);
    assert.deepEqual(await builder.compile(), { result: '', errors: [] });
});
