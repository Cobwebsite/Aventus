import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, , { AventusHTMLFile }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/File.ts',
]);

test('HTML file slot metadata is cached per internal version and recovers when its component returns', () => {
    const file = { uri: 'file:///round288-slots.wcv.avt', versionInternal: 1 };
    const classes = { First: { name: 'First' }, Second: { name: 'Second' } };
    const logic = { componentClassName: 'First', fileParsed: { classes } };
    const calls = [];
    const build = {
        getSlotsInfo(cls) {
            calls.push(cls.name);
            return { [cls.name.toLowerCase()]: { doc: `${cls.name} slot` } };
        },
    };
    const view = Object.create(AventusHTMLFile.prototype);
    view._file = file;
    view._build = build;
    Object.defineProperty(view, 'tsFile', { get: () => logic });

    const first = view.slotsInfo;
    assert.deepEqual(first, { first: { doc: 'First slot' } });
    assert.strictEqual(view.slotsInfo, first);
    assert.deepEqual(calls, ['First']);

    file.versionInternal = 2;
    logic.componentClassName = 'Second';
    assert.deepEqual(view.slotsInfo, { second: { doc: 'Second slot' } });
    assert.deepEqual(calls, ['First', 'Second']);

    file.versionInternal = 3;
    logic.fileParsed = null;
    assert.deepEqual(view.slotsInfo, {});
    assert.deepEqual(calls, ['First', 'Second']);

    file.versionInternal = 4;
    logic.fileParsed = { classes };
    logic.componentClassName = 'First';
    assert.deepEqual(view.slotsInfo, { first: { doc: 'First slot' } });
    assert.deepEqual(calls, ['First', 'Second', 'First']);
});
