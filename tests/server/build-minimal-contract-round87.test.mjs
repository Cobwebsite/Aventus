import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts',
]);

test('minimal full build writes each named output in npm, dependency, local order and reports errors in compile order', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-minimal-build-round87-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = GenericServer.instance;
    const notifications = [];
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 4,
        connection: {
            delayBetweenBuild: () => 0,
            sendNotification: (name, args) => notifications.push([name, args]),
        },
    };
    t.after(() => { GenericServer.instance = previous; });

    const main = join(root, 'dist', 'main.js');
    const vendor = join(root, 'dist', 'vendor.js');
    const npm = join(root, 'dist', 'npm.js');
    const npmError = { message: 'npm import missing' };
    const dependencyError = { message: 'dependency unavailable' };
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    build.initDone = true;
    build._allowBuild = true;
    build.diagnostics = new Map();
    build.buildConfig = {
        fullname: 'Demo@minimal', module: 'Demo',
        compile: [{
            output: [{
                '@default': { path: main },
                Vendor: { path: vendor },
                '@npm': { path: npm },
            }],
            package: [], outputNpm: { live: false },
        }],
    };
    let npmCompilations = 0;
    build.npmBuilder = { compile: async () => {
        npmCompilations++;
        return { result: '/* npm first */\n', errors: [npmError] };
    } };
    const writes = [];
    build.writeFile = async (path, content) => {
        writes.push(path);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    build.buildOrderCompilationInfo = async () => ({
        toCompile: ['Widget'],
        libSrc: [
            { lib: 'Fallback', code: '/* fallback second */' },
            { lib: 'Vendor', code: '/* vendor only */' },
        ],
        errors: [dependencyError],
    });
    build.buildLocalCode = async files => ({
        codeNoNamespaceBefore: [], code: [`class ${files[0]} {}`],
        classesName: {}, codeNoNamespaceAfter: [], stylesheets: {}, useDecorator: false,
        codeRenderInJs: [], codeNotRenderInJs: [],
    });
    build.writeBuildDocumentation = async () => {};

    await build.build();

    assert.equal(npmCompilations, 1);
    const mainText = readFileSync(main, 'utf8');
    const vendorText = readFileSync(vendor, 'utf8');
    const npmText = readFileSync(npm, 'utf8');
    assert.deepEqual(writes, [main, vendor, npm]);
    assert.ok(mainText.indexOf('fallback second') < mainText.indexOf('class Widget'));
    assert.doesNotMatch(mainText, /npm first|vendor only/);
    assert.match(vendorText, /vendor only/);
    assert.doesNotMatch(vendorText, /npm first|fallback second|class Widget/);
    assert.match(npmText, /npm first/);
    assert.doesNotMatch(npmText, /vendor only|fallback second|class Widget/);
    assert.deepEqual(notifications, [[
        'aventus/compiled', ['Demo@minimal', [npmError, dependencyError]],
    ]]);
});
