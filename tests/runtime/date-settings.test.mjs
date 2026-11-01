import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('DateSettings applies partial updates and returns independent configuration copies', () => {
    const { DateSettings } = loadRuntime();
    const initial = DateSettings.current;
    DateSettings.configure({ locale: ['fr-CH', 'en-US'], timeZone: 'Europe/Zurich',
        dateFormat: { year: '2-digit' }, firstDayOfWeek: 0 });
    const current = DateSettings.current;
    assert.deepEqual(Array.from(current.locale), ['fr-CH', 'en-US']);
    assert.equal(current.timeZone, 'Europe/Zurich');
    assert.equal(current.firstDayOfWeek, 0);
    assert.equal(current.dateFormat.year, '2-digit');
    assert.deepEqual({ ...current.timeFormat }, { ...initial.timeFormat });
    current.locale.push('de-CH');
    current.dateFormat.year = 'numeric';
    assert.deepEqual(Array.from(DateSettings.current.locale), ['fr-CH', 'en-US']);
    assert.equal(DateSettings.current.dateFormat.year, '2-digit');
});

test('DateSettings rejects invalid updates without changing its configuration', () => {
    const { DateSettings } = loadRuntime();
    DateSettings.configure({ locale: 'fr-CH', timeZone: 'Europe/Zurich' });
    const expected = DateSettings.current;
    const invalid = [
        { firstDayOfWeek: -1 },
        { firstDayOfWeek: 7 },
        { firstDayOfWeek: 1.5 },
        { timeZone: 'Invalid/Zone' },
        { dateFormat: null },
        { monthNameFormat: 'invalid' },
    ];
    for(const options of invalid) {
        assert.throws(() => DateSettings.configure(options));
        assert.deepEqual(JSON.parse(JSON.stringify(DateSettings.current)), JSON.parse(JSON.stringify(expected)));
    }
});
