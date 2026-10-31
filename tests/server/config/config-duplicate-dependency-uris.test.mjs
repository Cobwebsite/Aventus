import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusJSONLanguageService }, { SettingsManager }] = await loadServerModules([
    'language-services/json/LanguageService.ts', 'settings/Settings.ts',
]);

test('a build rejects two external dependencies with the same resolved URI', async t => {
    const previousSettings = SettingsManager.instance;
    const previousPackageDir = process.env.AVENTUS_TEST_PACKAGE_DIR;
    SettingsManager.instance = { settings: { defaultHideWarnings: false } };
    process.env.AVENTUS_TEST_PACKAGE_DIR = './packages';
    t.after(() => {
        SettingsManager.instance = previousSettings;
        if (previousPackageDir === undefined) delete process.env.AVENTUS_TEST_PACKAGE_DIR;
        else process.env.AVENTUS_TEST_PACKAGE_DIR = previousPackageDir;
    });

    const service = AventusJSONLanguageService.getInstance();
    const uri = 'file:///workspace/aventus.conf.avt';
    const makeFile = (version, dependencies) => {
        const content = JSON.stringify({ module: 'Demo', build: [{ name: 'web', src: [], dependencies }] });
        return { documentUser: TextDocument.create(uri, 'json', version, content) };
    };
    const duplicate = makeFile(1, {
        First: { uri: '%AVENTUS_TEST_PACKAGE_DIR%/Shared.package.avt', include: 'full' },
        Second: { uri: './packages/../packages/Shared.package.avt', include: 'need' },
    });
    const diagnostics = await service.validate(duplicate);
    assert.equal(diagnostics.length, 1);
    assert.match(diagnostics[0].message, /Dependencies First and Second use the same URI/);
    assert.equal(duplicate.documentUser.getText(diagnostics[0].range), '"./packages/../packages/Shared.package.avt"');
    const loadDiagnostics = [];
    assert.equal(await service.getConfig(duplicate, loadDiagnostics), null);
    assert.deepEqual(loadDiagnostics, diagnostics);

    const distinct = makeFile(2, {
        First: { uri: './packages/Shared.package.avt', include: 'full' },
        Second: { uri: './packages/Other.package.avt', include: 'need' },
    });
    assert.deepEqual(await service.validate(distinct), []);
    assert.ok(await service.getConfig(distinct));

    const sharedAcrossBuilds = { documentUser: TextDocument.create(uri, 'json', 3, JSON.stringify({
        module: 'Demo',
        build: [
            { name: 'web', src: [], dependencies: { First: { uri: './Shared.package.avt' } } },
            { name: 'admin', src: [], dependencies: { Second: { uri: './Shared.package.avt' } } },
        ],
    })) };
    assert.deepEqual(await service.validate(sharedAcrossBuilds), []);

    const inherited = { documentUser: TextDocument.create(uri, 'json', 4, JSON.stringify({
        module: 'Demo',
        dependencies: {
            First: { uri: './Shared.package.avt' },
            Second: { uri: './Shared.package.avt' },
        },
        build: [{ name: 'web', src: [], dependencies: { Local: { uri: './Other.package.avt' } } }],
    })) };
    const inheritedDiagnostics = await service.validate(inherited);
    assert.equal(inheritedDiagnostics.length, 1);
    assert.match(inheritedDiagnostics[0].message, /Dependencies First and Second use the same URI/);
    assert.equal(inherited.documentUser.getText(inheritedDiagnostics[0].range), '"./Shared.package.avt"');

    const globalAndLocal = { documentUser: TextDocument.create(uri, 'json', 5, JSON.stringify({
        module: 'Demo',
        dependencies: { Global: { uri: '%AVENTUS_TEST_PACKAGE_DIR%/Shared.package.avt' } },
        build: [{ name: 'web', src: [], dependencies: { Local: { uri: './packages/Shared.package.avt' } } }],
    })) };
    const crossDiagnostics = await service.validate(globalAndLocal);
    assert.equal(crossDiagnostics.length, 1);
    assert.match(crossDiagnostics[0].message, /Dependencies Global and Local use the same URI/);
    assert.equal(globalAndLocal.documentUser.getText(crossDiagnostics[0].range), '"./packages/Shared.package.avt"');

    const dotted = makeFile(6, {
        First: { uri: './Shared.package.avt' },
        'Second.alias': { uri: './Shared.package.avt' },
    });
    const dottedDiagnostics = await service.validate(dotted);
    assert.equal(dottedDiagnostics.length, 1);
    assert.equal(dotted.documentUser.getText(dottedDiagnostics[0].range), '"./Shared.package.avt"');

    const missingRange = service.getConfigPathRange(dotted.documentUser, undefined, 'build[0].dependencies.Missing.uri');
    assert.equal(dotted.documentUser.getText(missingRange), dotted.documentUser.getText());
});
