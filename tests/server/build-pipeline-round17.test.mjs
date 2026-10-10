import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts',
]);

function pipeline(t, compile) {
    const events = [];
    const previous = GenericServer.instance;
    GenericServer.instance = {
        _noBuild: false,
        logLevel: 4,
        connection: { delayBetweenBuild: () => 0,
            sendNotification: (name, args) => events.push(['notification', name, args]) },
    };
    t.after(() => { GenericServer.instance = previous; });
    const build = Object.create(Build.prototype);
    build.initDone = true;
    build._allowBuild = true;
    build.buildConfig = { fullname: 'Demo@web', module: 'Demo', compile };
    build.diagnostics = new Map();
    build.writeBuildI18n = async i18n => events.push(['i18n', i18n]);
    build.buildOrderCompilationInfo = async config => {
        events.push(['order', config.id]);
        return { toCompile: [config.id], libSrc: [], errors: config.dependencyErrors ?? [] };
    };
    build.buildLocalCode = async files => {
        events.push(['code', files[0]]);
        return { codeRenderInJs: [], codeNotRenderInJs: [] };
    };
    build.writeBuildCode = async (_result, _libs, output) => {
        events.push(['write', output]);
        return output.errors ?? [];
    };
    build.writeBuildDocumentation = async (pkg) => events.push(['docs', pkg]);
    build.writeBuildNpm = async npm => events.push(['npm', npm.path]);
    return { build, events };
}

test('a build processes each compile configuration in order and publishes completion once', async t => {
    const first = { id: 'first', i18n: 'translations', output: { errors: [] },
        package: 'first-package', outputNpm: { live: false } };
    const second = { id: 'second', output: { errors: [] },
        package: 'second-package', outputNpm: { live: true, path: ['dist'] } };
    const { build, events } = pipeline(t, [first, second]);

    await build.build();

    assert.deepEqual(events, [
        ['i18n', 'translations'], ['order', 'first'], ['code', 'first'],
        ['write', first.output], ['docs', 'first-package'],
        ['order', 'second'], ['code', 'second'], ['write', second.output],
        ['docs', 'second-package'], ['npm', ['dist']],
        ['notification', 'aventus/compiled', ['Demo@web', []]],
    ]);
});

test('a build combines output and dependency errors from its final compile configuration', async t => {
    const outputError = { message: 'output failed' };
    const dependencyError = { message: 'dependency missing' };
    const { build, events } = pipeline(t, [{ id: 'one',
        output: { errors: [outputError] }, dependencyErrors: [dependencyError],
        package: 'package', outputNpm: { live: false } }]);

    await build.build();

    assert.deepEqual(events.at(-1), ['notification', 'aventus/compiled',
        ['Demo@web', [outputError, dependencyError]]]);
});

test('a build reports errors from every compile configuration', async t => {
    const firstError = { message: 'first output failed' };
    const firstDependencyError = { message: 'first dependency missing' };
    const secondError = { message: 'second output failed' };
    const { build, events } = pipeline(t, [
        { id: 'one', output: { errors: [firstError] }, dependencyErrors: [firstDependencyError], package: 'one', outputNpm: { live: false } },
        { id: 'two', output: { errors: [secondError] }, package: 'two', outputNpm: { live: false } },
    ]);

    await build.build();

    assert.deepEqual(events.at(-1), ['notification', 'aventus/compiled', ['Demo@web', [firstError, firstDependencyError, secondError]]]);
});

test('a successful final configuration does not erase earlier errors', async t => {
    const firstError = { message: 'first output failed' };
    const { build, events } = pipeline(t, [
        { id: 'one', output: { errors: [firstError] }, package: 'one', outputNpm: { live: false } },
        { id: 'two', output: { errors: [] }, package: 'two', outputNpm: { live: false } },
    ]);

    await build.build();

    assert.deepEqual(events.at(-1), ['notification', 'aventus/compiled', ['Demo@web', [firstError]]]);
});
