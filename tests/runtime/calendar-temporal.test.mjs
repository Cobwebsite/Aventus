import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Temporal } from 'temporal-polyfill';
import { loadRuntimeContext } from './helpers/load-runtime.mjs';

test('the runtime calendar classes use the injected Temporal implementation', () => {
    const globals = loadRuntimeContext();
    assert.equal(globals.Temporal, Temporal);
    const { Date: CalendarDate, DateTime, Time } = globals.Aventus;

    const date = CalendarDate.parse('2024-02-29');
    assert.equal(date.toString(), '2024-02-29');
    assert.equal(date.addDays(1).toString(), '2024-03-01');
    assert.equal(date.toTemporal() instanceof Temporal.PlainDate, true);

    const time = Time.parse('23:30');
    assert.equal(time.addHours(1).toString(), '00:30:00');
    assert.equal(time.toTemporal() instanceof Temporal.PlainTime, true);

    const instant = DateTime.parse('2024-02-29T12:30:00+01:00');
    assert.equal(instant.toString(), '2024-02-29T11:30:00Z');
    assert.equal(instant.toTemporal() instanceof Temporal.PlainDateTime, true);
});
