import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { checkTxtBefore, checkTxtAfter } = await loadServerModule('tools.ts');

function file(content) {
    return {
        contentUser: content,
        documentUser: {
            offsetAt: position => position.character,
            getText: () => content,
        },
    };
}

test('text searches skip spaces in both directions and include document boundaries', () => {
    const document = file('a b c');
    assert.equal(checkTxtBefore(document, { line: 0, character: 5 }, 'abc'), true);
    assert.equal(checkTxtAfter(document, { line: 0, character: 0 }, 'abc'), true);
    assert.equal(checkTxtBefore(document, { line: 0, character: 5 }, 'abd'), false);
    assert.equal(checkTxtAfter(document, { line: 0, character: 0 }, 'abd'), false);
});

test('text searches finish when spaces reach either document boundary', () => {
    const document = file('  a  ');
    assert.equal(checkTxtBefore(document, { line: 0, character: 2 }, 'a'), false);
    assert.equal(checkTxtAfter(document, { line: 0, character: 3 }, 'a'), false);
});
