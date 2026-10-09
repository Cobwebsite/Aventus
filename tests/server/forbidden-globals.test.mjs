import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { isForbiddenNativeGlobal, isForbiddenNativeGlobalSymbol } =
    await loadServerModule('language-services/ts/ForbiddenNativeGlobals.ts');

function symbolFrom(fileName, isDeclarationFile = true) {
    return { declarations: [{ getSourceFile: () => ({ fileName, isDeclarationFile }) }] };
}

test('native Date is forbidden only when declared by a TypeScript standard library', () => {
    assert.match(isForbiddenNativeGlobalSymbol('Date', symbolFrom('lib.es2023.d.ts')), /Aventus.Date/);
    assert.match(isForbiddenNativeGlobalSymbol('Date', symbolFrom('C:\\typescript\\lib.dom.d.ts')), /Aventus.Date/);
    assert.equal(isForbiddenNativeGlobalSymbol('Date', symbolFrom('src/Date.ts', false)), undefined);
    assert.equal(isForbiddenNativeGlobalSymbol('Date', symbolFrom('types/custom.d.ts')), undefined);
    assert.equal(isForbiddenNativeGlobalSymbol('Date', undefined), undefined);
    assert.equal(isForbiddenNativeGlobalSymbol('Math', symbolFrom('lib.es2023.d.ts')), undefined);
});

test('global check avoids symbol lookup for names outside the forbidden list', () => {
    const checker = { getSymbolAtLocation: () => { throw new Error('unexpected lookup'); } };
    assert.equal(isForbiddenNativeGlobal({ text: 'Math' }, checker), undefined);
    assert.match(isForbiddenNativeGlobal({ text: 'Date' }, {
        getSymbolAtLocation: () => symbolFrom('lib.es2023.d.ts'),
    }), /Aventus.Date/);
});
