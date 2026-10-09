import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { replaceNotImportAliases, simplifyUri, setValueToObject, escapeRegex } = await loadServerModule('tools.ts');

test('ordinary aliases replace every unescaped occurrence while @ aliases stay untouched', () => {
    const config = { aliases: { '%root%': '/app/src', '@skip': '/ignored' } };
    assert.equal(
        replaceNotImportAliases('%root%/a + \\%root%/b + @skip', config),
        '/app/src/a + \\%root%/b + @skip',
    );
    assert.equal(replaceNotImportAliases('%root%', null), '%root%');
});

test('relative import URI crosses directories and decodes escaped filename characters', () => {
    const current = 'file:///D:/app/src/views/Widget.wcl.avt';
    assert.equal(simplifyUri('file:///D:/app/src/styles/a%20b.wcs.avt', current), '../styles/a b.wcs.avt');
    assert.equal(simplifyUri('file:///D:/app/src/views/Other.wcl.avt', current), './Other.wcl.avt');
});

test('nested value helper accepts bracket notation and existing intermediate objects', () => {
    const target = { translations: { en: { existing: 'kept' } } };
    setValueToObject('translations[en].welcome', target, 'Hello');
    assert.deepEqual(target, { translations: { en: { existing: 'kept', welcome: 'Hello' } } });
});

test('nested value helper currently stores a missing Map branch as a property outside the Map', () => {
    const target = new Map();
    setValueToObject('parent.child', target, 42);
    assert.equal(target.get('parent'), undefined);
    assert.deepEqual(target.parent, { child: 42 });
    setValueToObject('single', target, 7);
    assert.equal(target.get('single'), 7);
});

test('regex escaping treats wildcard literally unless explicitly retained', () => {
    const escaped = escapeRegex('a.*[b]');
    assert.equal(new RegExp(`^${escaped}$`).test('a.*[b]'), true);
    assert.equal(new RegExp(`^${escaped}$`).test('a.xyz[b]'), false);
    assert.equal(escapeRegex('a*b', true), 'a*b');
});
