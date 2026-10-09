import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Build } = await loadServerModule('project/Build.ts');

function setup() {
    const calls = [];
    const file = name => ({
        init: async () => calls.push(`init:${name}`),
        validate: async () => calls.push(`validate:${name}`),
        triggerSave: async () => calls.push(`save:${name}`),
    });
    const build = Object.create(Build.prototype);
    build.scssLanguageService = { allowRebuildDefinition: value => calls.push(`scss:${value}`) };
    build.htmlLanguageService = { allowRebuildDefinition: value => calls.push(`html:${value}`) };
    build.tsLanguageService = { i18nFiles: { translation: file('translation') } };
    build.i18nComponentsFiles = { componentTranslation: file('componentTranslation') };
    build.wcFiles = { component: file('component') };
    build.scssFiles = { style: file('style') };
    build.htmlFiles = { view: file('view') };
    build.tsFiles = { logic: file('logic') };
    build.npmBuilder = { rebuildInfo: () => calls.push('npm') };
    build._build = async () => calls.push('build:initial');
    build.build = async () => calls.push('build:normal');
    return { build, calls };
}

test('initial rebuild initializes component, style and HTML before validation and save', async () => {
    const { build, calls } = setup();
    build.initDone = false;
    await build.rebuildAll(true);
    assert.deepEqual(calls, [
        'scss:false', 'html:false',
        'validate:translation', 'validate:componentTranslation',
        'init:component', 'init:style', 'validate:style',
        'init:view', 'validate:view', 'validate:logic',
        'scss:true', 'html:true',
        'save:style', 'save:component', 'save:logic',
        'npm', 'build:initial',
    ]);
    assert.equal(build.insideRebuildAll, false);
    assert.equal(build._allowBuild, true);
});

test('subsequent rebuild skips initialization and runs normal build after save notifications', async () => {
    const { build, calls } = setup();
    build.initDone = true;
    await build.rebuildAll();
    assert.deepEqual(calls, [
        'scss:false', 'html:false',
        'validate:translation', 'validate:componentTranslation',
        'validate:style', 'validate:view', 'validate:logic',
        'scss:true', 'html:true',
        'save:style', 'save:component', 'save:logic',
        'npm', 'build:normal',
    ]);
    assert.equal(build.insideRebuildAll, false);
    assert.equal(build._allowBuild, true);
});
