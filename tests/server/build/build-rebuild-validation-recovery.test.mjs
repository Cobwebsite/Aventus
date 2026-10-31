import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { Build } = await loadServerModule('project/Build.ts');

test('a validation failure restores rebuild state before a later successful retry', async () => {
    const calls = [];
    let failValidation = true;
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    build.initDone = true;
    build.scssLanguageService = { allowRebuildDefinition: enabled => calls.push(`scss:${enabled}`) };
    build.htmlLanguageService = { allowRebuildDefinition: enabled => calls.push(`html:${enabled}`) };
    build.tsLanguageService = { i18nFiles: {} };
    build.i18nComponentsFiles = {};
    build.wcFiles = {};
    build.scssFiles = {
        style: {
            validate: async () => {
                calls.push('validate:style');
                if (failValidation) throw new Error('validation failed');
            },
            triggerSave: async () => calls.push('save:style'),
        },
    };
    build.htmlFiles = {};
    build.tsFiles = {};
    build.npmBuilder = { rebuildInfo: () => calls.push('npm') };
    build.build = async () => calls.push('build');

    await assert.rejects(build.rebuildAll(), /validation failed/);
    assert.deepEqual(calls, ['scss:false', 'html:false', 'validate:style', 'scss:true', 'html:true']);
    assert.equal(build._allowBuild, true);
    assert.equal(build.insideRebuildAll, false);

    failValidation = false;
    await build.rebuildAll();
    assert.deepEqual(calls.slice(5), [
        'scss:false', 'html:false', 'validate:style', 'scss:true', 'html:true',
        'save:style', 'npm', 'build',
    ]);
    assert.equal(build._allowBuild, true);
    assert.equal(build.insideRebuildAll, false);
});
