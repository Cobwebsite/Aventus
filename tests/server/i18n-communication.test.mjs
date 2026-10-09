import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GetLocales }, { GetKeyFromPosition }, { ProjectManager }] = await loadServerModules([
    'communication/i18n/GetLocales.ts',
    'communication/i18n/GetKeyFromPosition.ts',
    'project/ProjectManager.ts',
]);

function withBuilds(builds, callback) {
    const previous = ProjectManager.instance;
    ProjectManager.instance = { getMatchingBuildsByUri: () => builds };
    return Promise.resolve().then(callback).finally(() => { ProjectManager.instance = previous; });
}

test('i18n locale request selects the first configured matching build', async () => {
    const command = new GetLocales();
    assert.equal(command.channel(), 'aventus.i18n.getLocales');
    await withBuilds([
        { buildConfig: { i18n: { locales: ['en'] } } },
        { buildConfig: { i18n: { locales: ['fr', 'en'], fallback: 'fr' } } },
    ], async () => {
        assert.deepEqual(await command.run({ uri: 'file:///component.ts.avt' }), { locales: ['fr', 'en'], fallback: 'fr' });
        assert.equal(await command.run({ uri: '' }), null);
    });
});

test('i18n position request finds component key then TypeScript key', async () => {
    const command = new GetKeyFromPosition();
    assert.equal(command.channel(), 'aventus.i18n.getKeyFromPosition');
    const uri = 'file:///component.ts.avt';
    const range = [{ line: 0, character: 1 }, { line: 0, character: 3 }];
    const calls = [];
    await withBuilds([{
        i18nComponentsFiles: { [uri]: { getKeyFromLocation: value => { calls.push(['component', value]); return null; } } },
        tsLanguageService: { i18nFiles: { [uri]: { getKeyFromLocation: value => { calls.push(['ts', value]); return 'hello'; } } } },
    }], async () => {
        assert.equal(await command.run({ uri, range }), 'hello');
        assert.deepEqual(calls, [['component', range], ['ts', range]]);
        assert.equal(await command.run({ uri: '', range }), null);
    });
});
