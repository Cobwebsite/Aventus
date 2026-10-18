import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusPackageFile }, { GenericServer }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/ts/package/File.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4, _savePath: 'D:/round289' };

const uri = 'file:///D:/round289/Catalog.package.avt';

function content(version, css, dependencies) {
    return [
        `// Catalog@web:1.2.${version}`,
        '//#region js def //',
        `declare namespace Catalog { class Card${version} {} }`,
        '//#endregion js def //',
        '//#region js src //',
        JSON.stringify({ namespace: 'Catalog', available: [{ fullName: `Catalog.Card${version}` }], existing: [] }),
        '//#endregion js src //',
        '//#region css def //', JSON.stringify({ revision: version }), '//#endregion css def //',
        '//#region css //', JSON.stringify(css), '//#endregion css //',
        '//#region html //', JSON.stringify({ revision: version }), '//#endregion html //',
        '//#region dependencies //', JSON.stringify(dependencies), '//#endregion dependencies //',
    ].join('\n');
}

test('package file replaces parsed sections on the same instance and removes external definitions on deletion', async () => {
    const events = [];
    const file = new InternalAventusFile(TextDocument.create(uri, 'typescript', 1, content(1, { Card: '.first{}' }, { First: '1.0.0' })));
    const build = {
        getNamespace: () => '',
        tsLanguageService: {
            addFile: item => events.push(['ts-add', item.file.uri]),
            removeFile: item => events.push(['ts-remove', item.file.uri]),
        },
        scssLanguageService: {
            addExternalDefinition: (key, doc) => events.push(['scss-add', key, doc.revision]),
            removeExternalDefinition: key => events.push(['scss-remove', key]),
        },
        htmlLanguageService: {
            addExternalDefinition: (key, doc) => events.push(['html-add', key, doc.revision]),
            removeExternalDefinition: key => events.push(['html-remove', key]),
        },
        externalPackageInformation: { rebuild: () => events.push(['rebuild']) },
        npmBuilder: { unregister: key => events.push(['unregister', key]) },
        build: () => events.push(['build']),
        diagnostics: new Map(),
        reloadPage: false,
    };
    const pkg = new AventusPackageFile(file, build);
    assert.equal(pkg.name, 'Catalog@web');
    assert.equal(pkg.versionTxt, '1.2.1');
    assert.deepEqual(pkg.externalCSS, { Card: '.first{}' });
    assert.deepEqual(pkg.dependencies, { First: '1.0.0' });
    assert.equal(pkg.srcInfo.available[0].fullName, 'Catalog.Card1');
    assert.match(pkg.definition, /Card1/);
    assert.equal(events.filter(([name]) => name === 'ts-add').length, 1);

    await file.triggerContentChange(TextDocument.create(uri, 'typescript', 2, content(2, { Card: '.second{}' }, { Second: '2.0.0' })));
    for (let attempt = 0; attempt < 50 && !pkg.definition.includes('Card2'); attempt++) {
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.equal(pkg.versionTxt, '1.2.2');
    assert.deepEqual(pkg.externalCSS, { Card: '.second{}' });
    assert.deepEqual(pkg.dependencies, { Second: '2.0.0' });
    assert.equal(pkg.srcInfo.available[0].fullName, 'Catalog.Card2');
    assert.match(pkg.definition, /Card2/);
    assert.equal(events.filter(([name]) => name === 'ts-add').length, 1);
    assert.equal(events.filter(([name]) => name === 'rebuild').length, 2);
    assert.equal(events.filter(([name]) => name === 'build').length, 1);
    assert.equal(build.reloadPage, true);

    await file.triggerDelete();
    assert.deepEqual(events.filter(([name]) => name.endsWith('-remove')), [
        ['scss-remove', uri], ['html-remove', uri], ['ts-remove', uri],
    ]);
    assert.ok(events.filter(([name, key]) => name === 'unregister' && key === uri).length >= 1);
});
