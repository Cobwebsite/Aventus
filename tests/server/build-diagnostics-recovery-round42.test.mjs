import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { AventusTsFile }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'language-services/ts/File.ts',
]);

test('a multi-output build publishes source diagnostics and clears them after a corrected rebuild', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.build-diagnostics-round42-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const outputs = [join(root, 'first.js'), join(root, 'second.js')];
    const diagnostics = [];
    const compiled = [];
    const previous = GenericServer.instance;
    GenericServer.instance = {
        _noBuild: false, logLevel: 4,
        connection: {
            delayBetweenBuild: () => 0,
            sendDiagnostics: (params, buildName) => diagnostics.push([params, buildName]),
            sendNotification: (name, args) => compiled.push([name, args]),
        },
    };
    t.after(() => { GenericServer.instance = previous; });

    // The build identifies source diagnostics through instanceof AventusTsFile.
    const source = Object.create(AventusTsFile.prototype);
    Object.defineProperty(source, 'file', { value: { uri: 'file:///demo/src/component.lib.avt' } });
    source.getDiagnostics = () => [];
    const build = Object.create(Build.prototype);
    build.initDone = true;
    build._allowBuild = true;
    build.buildConfig = {
        fullname: 'Demo@multi', module: 'Demo', hideWarnings: true,
        compile: outputs.map((path, id) => ({
            id, output: [{ '@default': { path } }], package: [],
            outputNpm: { live: false },
        })),
    };
    build.diagnostics = new Map();
    build.npmBuilder = { compile: async () => ({ result: '', errors: [] }) };
    build.writeFile = async (path, content) => writeFileSync(path, content);
    build.writeBuildDocumentation = async () => {};
    let revision = 'Broken';
    build.buildOrderCompilationInfo = async config => ({ toCompile: [config.id], libSrc: [], errors: [] });
    build.buildLocalCode = async files => {
        if (revision === 'Broken') {
            build.addDiagnostic(source, {
                message: files[0] === 0 ? 'first output warning' : 'second output error',
                severity: files[0] === 0 ? 2 : 1,
            });
        }
        return {
            codeNoNamespaceBefore: [], code: [`class ${revision}${files[0]} {}`],
            classesName: {}, codeNoNamespaceAfter: [], stylesheets: {}, useDecorator: false,
            codeRenderInJs: [], codeNotRenderInJs: [],
        };
    };

    await build.build();
    assert.match(readFileSync(outputs[0], 'utf8'), /Broken0/);
    assert.match(readFileSync(outputs[1], 'utf8'), /Broken1/);
    assert.deepEqual(diagnostics, [[{
        uri: source.file.uri,
        diagnostics: [{ message: 'second output error', severity: 1 }],
    }, 'Demo@multi']]);
    assert.deepEqual(compiled, [['aventus/compiled', ['Demo@multi', []]]]);

    revision = 'Fixed';
    await build.build();
    assert.match(readFileSync(outputs[0], 'utf8'), /Fixed0/);
    assert.match(readFileSync(outputs[1], 'utf8'), /Fixed1/);
    assert.deepEqual(diagnostics.at(-1), [{ uri: source.file.uri, diagnostics: [] }, 'Demo@multi']);
    assert.equal(diagnostics.length, 2);
    assert.equal(build.diagnostics.size, 0);
    assert.deepEqual(compiled, [
        ['aventus/compiled', ['Demo@multi', []]],
        ['aventus/compiled', ['Demo@multi', []]],
    ]);
});
