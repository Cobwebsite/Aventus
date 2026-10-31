import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

function bundleExports(result) {
    const context = {};
    runInNewContext(result, context);
    return Object.values(context.npmCompilation);
}

test('npm wildcard exports select browser entries and replace subpaths through import revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-wildcard-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const oldServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = oldServer; });

    const nodeModulesDir = join(root, 'node_modules');
    const packageDir = join(nodeModulesDir, '@wild', 'fixture');
    mkdirSync(join(packageDir, 'browser'), { recursive: true });
    mkdirSync(join(packageDir, 'node'), { recursive: true });
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({
        name: '@wild/fixture', version: '1.0.0', type: 'module',
        exports: {
            './features/*': {
                browser: './browser/*.js',
                node: './node/*.js',
            },
        },
    }));
    for (const feature of ['alpha', 'beta']) {
        writeFileSync(join(packageDir, 'browser', `${feature}.js`), `export const value = '${feature}-browser';\n`);
        writeFileSync(join(packageDir, 'node', `${feature}.js`), `export const value = '${feature}-node';\n`);
    }

    const builder = new NpmBuilder({ isBuildAllowed: true, nodeModulesDir, fullname: 'Wildcard' });
    const source = 'file:///wildcard.lib.avt';
    builder.register(source, { uri: '@wild/fixture/features/alpha', libName: 'value', alias: 'selected' });
    const first = await builder.compile();
    assert.deepEqual(first.errors, []);
    assert.deepEqual(bundleExports(first.result).map(exports => exports.selected), ['alpha-browser']);

    builder.unregister(source);
    builder.register(source, { uri: '@wild/fixture/features/beta', libName: 'value', alias: 'selected' });
    const second = await builder.compile();
    assert.deepEqual(second.errors, []);
    assert.deepEqual(bundleExports(second.result).map(exports => exports.selected), ['beta-browser']);
    assert.doesNotMatch(second.result, /alpha-browser/);

    builder.unregister(source);
    assert.deepEqual(await builder.compile(), { result: '', errors: [] });
});
