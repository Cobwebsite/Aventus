import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules(['project/Build.ts', 'GenericServer.ts']);

test('npm rebuild owns generated files independently in two destinations', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-two-outputs-'));
    const previousServer = GenericServer.instance;
    GenericServer.instance = { ...(previousServer ?? {}), workspaces: [pathToFileURL(root).href] };
    t.after(() => { GenericServer.instance = previousServer; });
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const outputs = [join(root, 'first'), join(root, 'second')];
    const build = Object.create(Build.prototype);
    build.buildConfig = { fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0' };
    build.project = { getConfigFile: () => ({ folderPath: root }) };
    build.tsFiles = {};
    build.externalPackageInformation = { filesUri: [], getByUri: () => undefined };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const options = { path: outputs, packageJson: false, manifest: false, npmName: '@demo/web' };
    const result = (names) => ({
        npm: { Demo: { content: names.map(name => `export declare class ${name} {}`), imports: {} } },
        npmsrc: Object.fromEntries(names.map(name => [
            `${name.toLowerCase()}.js`, {
                names: [`Demo.${name}`], content: [`export class ${name} {}`], imports: {},
                forcedDependencies: [], sourceUri: [],
            },
        ])),
    });

    await build.writeBuildNpm(options, result(['Alpha', 'Beta']));
    for (const output of outputs) {
        assert.match(readFileSync(join(output, 'Demo', 'index.js'), 'utf8'), /Beta/);
        assert.equal(existsSync(join(output, '__src', 'beta.js')), true);
        const generated = JSON.parse(readFileSync(join(root, '.aventus', 'npm', 'register.json'), 'utf8'))[output.replace(/\\/g, '/')];
        assert.ok(generated['__src/beta.js']);
    }

    // A user edit in one destination must not be removed by the next build.
    const edited = join(outputs[1], '__src', 'beta.js');
    writeFileSync(edited, 'export class Beta { userEdit = true; }');
    await build.writeBuildNpm(options, result(['Alpha']));
    assert.equal(existsSync(join(outputs[0], '__src', 'beta.js')), false);
    assert.equal(readFileSync(edited, 'utf8'), 'export class Beta { userEdit = true; }');
    for (const output of outputs) {
        assert.doesNotMatch(readFileSync(join(output, 'Demo', 'index.js'), 'utf8'), /Beta/);
        assert.doesNotMatch(readFileSync(join(output, 'Demo', 'index.d.ts'), 'utf8'), /Beta/);
        assert.equal(existsSync(join(output, '__src', 'alpha.js')), true);
        const generated = JSON.parse(readFileSync(join(root, '.aventus', 'npm', 'register.json'), 'utf8'))[output.replace(/\\/g, '/')];
        assert.equal(Object.hasOwn(generated, '__src/beta.js'), false);
    }
});
