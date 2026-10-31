import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

function output(result) {
    const context = {};
    runInNewContext(result, context);
    return Object.values(context.npmCompilation);
}

test('npm bundle executes conditional ESM and CommonJS imports after a dependency edit and import revision', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-conditional-mixed-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = previousServer; });

    const nodeModulesDir = join(root, 'node_modules');
    const esmDir = join(nodeModulesDir, 'conditional-fixture');
    const cjsDir = join(nodeModulesDir, 'legacy-fixture');
    mkdirSync(esmDir, { recursive: true });
    mkdirSync(cjsDir, { recursive: true });
    writeFileSync(join(esmDir, 'package.json'), JSON.stringify({
        name: 'conditional-fixture', version: '1.0.0', type: 'module',
        exports: { '.': { import: './esm.js', require: './cjs.cjs' } },
    }));
    writeFileSync(join(esmDir, 'esm.js'), 'import { suffix } from "./helper.js"; export const label = () => "esm-" + suffix; export const kind = "import";\n');
    writeFileSync(join(esmDir, 'cjs.cjs'), 'exports.label = () => "wrong-branch"; exports.kind = "require";\n');
    const helper = join(esmDir, 'helper.js');
    writeFileSync(helper, 'export const suffix = "one";\n');
    writeFileSync(join(cjsDir, 'package.json'), JSON.stringify({ name: 'legacy-fixture', version: '1.0.0', main: 'index.js' }));
    writeFileSync(join(cjsDir, 'index.js'), 'exports.number = () => 42;\n');

    const builder = new NpmBuilder({ isBuildAllowed: true, nodeModulesDir, fullname: 'ConditionalMixed' });
    assert.deepEqual(builder.register('file:///conditional.lib.avt', { uri: 'conditional-fixture', libName: 'label', alias: 'title' }), []);
    assert.deepEqual(builder.register('file:///legacy.lib.avt', { uri: 'legacy-fixture', libName: 'number', alias: 'answer' }), []);

    const first = await builder.compile();
    assert.deepEqual(first.errors, []);
    assert.equal(output(first.result).find(entry => entry.title)?.title(), 'esm-one');
    assert.equal(output(first.result).find(entry => entry.answer)?.answer(), 42);
    assert.doesNotMatch(first.result, /wrong-branch/);

    writeFileSync(helper, 'export const suffix = "two";\n');
    builder.register('file:///conditional-kind.lib.avt', { uri: 'conditional-fixture', libName: 'kind', alias: 'format' });
    const revised = await builder.compile();
    assert.deepEqual(revised.errors, []);
    const values = output(revised.result);
    assert.equal(values.find(entry => entry.title)?.title(), 'esm-two');
    assert.equal(values.find(entry => entry.format)?.format, 'import');
    assert.equal(values.find(entry => entry.answer)?.answer(), 42);
});
