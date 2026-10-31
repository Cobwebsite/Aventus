import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts',
]);

test('a Storybook write failure leaves staged JS untouched and the same build recovers', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.build-story-recovery-round201-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousServer = GenericServer.instance;
    const notifications = [];
    GenericServer.instance = {
        _noBuild: false, logLevel: 4,
        connection: {
            delayBetweenBuild: () => 0,
            sendNotification: (name, args) => notifications.push([name, args]),
        },
    };
    t.after(() => { GenericServer.instance = previousServer; });

    const output = join(root, 'app.js');
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    build.initDone = true;
    build._allowBuild = true;
    build.buildConfig = {
        fullname: 'Demo@story', module: 'Demo',
        compile: [{ output: [{ '@default': { path: output } }], package: [], outputNpm: { live: false } }],
        stories: { live: true, output: join(root, 'stories') },
    };
    build.diagnostics = new Map();
    build.tsFiles = {};
    build.npmBuilder = { compile: async () => ({ result: '', errors: [] }) };
    build.writeBuildDocumentation = async () => {};
    build.writeBuildNpm = async () => {};
    const originalWrite = build.writeFile.bind(build);
    build.writeFile = async (path, content) => {
        if (build.pendingOutputs) return originalWrite(path, content);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    build.buildOrderCompilationInfo = async () => ({ toCompile: [], libSrc: [], errors: [] });
    let revision = 'Initial';
    build.buildLocalCode = async () => ({
        codeNoNamespaceBefore: [], code: [`class ${revision} {}`], classesName: {},
        codeNoNamespaceAfter: [], stylesheets: {}, useDecorator: false,
        codeRenderInJs: [], codeNotRenderInJs: [],
    });
    let failStory = false;
    const storyWrites = [];
    build.stories = {
        check: async () => {},
        write: async () => {
            if (failStory) throw new Error('storybook destination unavailable');
            storyWrites.push(revision);
        },
    };

    await build.build();
    assert.match(readFileSync(output, 'utf8'), /Initial/);
    assert.deepEqual(storyWrites, ['Initial']);

    revision = 'Interrupted';
    failStory = true;
    await assert.rejects(build.build(), /storybook destination unavailable/);
    assert.match(readFileSync(output, 'utf8'), /Initial/);
    assert.equal(build.pendingOutputs, undefined);
    assert.deepEqual(storyWrites, ['Initial']);
    assert.equal(notifications.filter(([name]) => name === 'aventus/compiled').length, 1);

    revision = 'Recovered';
    failStory = false;
    await build.build();
    assert.match(readFileSync(output, 'utf8'), /Recovered/);
    assert.deepEqual(storyWrites, ['Initial', 'Recovered']);
    assert.equal(notifications.filter(([name]) => name === 'aventus/compiled').length, 2);
});
