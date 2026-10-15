import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusPackageFile } = await loadServerModule('language-services/ts/package/File.ts');

const source = name => ({
    contentUser: `// ${name}:1.2.3\n//#region js def //\n//#endregion js def //`,
});

test('Aventus package headers accept only a name or module@name', () => {
    for (const name of ['Demo', 'Demo_2', 'Demo@web_2']) {
        assert.equal(AventusPackageFile.getQuickInfo(source(name))?.name, name);
    }
    for (const name of ['../escaped', '@org/library', 'Demo@web@other', '.Demo']) {
        assert.equal(AventusPackageFile.getQuickInfo(source(name)), undefined);
    }
});
