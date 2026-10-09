import assert from 'node:assert/strict';
import test from 'node:test';
import {
    ColorNotation,
    normalizeRelativeColorDataChannels,
    noneToZeroInRelativeColorDataChannels,
    convertPowerlessComponentsToZeroValuesForDisplay,
    XYZ_D50_to_sRGB_Gamut,
    colorData_to_XYZ_D50,
} from '../../server/src/color-picker/ColorData.ts';

const data = (colorNotation, channels, alpha = 0.5) => ({
    colorNotation, channels, alpha, syntaxFlags: new Set(),
});

test('relative RGB components use 0–255 while color() RGB components retain 0–1', () => {
    const rgb = normalizeRelativeColorDataChannels(data(ColorNotation.RGB, [0.25, 0.5, 1]));
    assert.deepEqual([...rgb.keys()], ['r', 'g', 'b', 'alpha']);
    assert.deepEqual([...rgb.values()].map(token => token[4].value), [63.75, 127.5, 255, 0.5]);

    const srgb = normalizeRelativeColorDataChannels(data(ColorNotation.sRGB, [0.25, 0.5, 1]));
    assert.deepEqual([...srgb.values()].map(token => token[4].value), [0.25, 0.5, 1, 0.5]);
});

test('relative components expose notation-specific names and omit nonnumeric alpha', () => {
    const hwb = normalizeRelativeColorDataChannels(data(ColorNotation.HWB, [120, 25, 30], { variable: true }));
    assert.deepEqual([...hwb.keys()], ['h', 'w', 'b']);
    assert.deepEqual([...hwb.values()].map(token => token[4].value), [120, 25, 30]);

    const xyz = normalizeRelativeColorDataChannels(data(ColorNotation.XYZ_D50, [0.1, 0.2, 0.3], 1));
    assert.deepEqual([...xyz.keys()], ['x', 'y', 'z', 'alpha']);
    assert.deepEqual([...xyz.values()].map(token => token[4].value), [0.1, 0.2, 0.3, 1]);
});

test('none components become zero in a copy of the relative channel map', () => {
    const original = normalizeRelativeColorDataChannels(data(ColorNotation.LCH, [75, NaN, NaN], NaN));
    assert.deepEqual([...original.keys()], ['l', 'c', 'h', 'alpha']);
    assert.equal(original.get('c')[1], 'none');
    const normalized = noneToZeroInRelativeColorDataChannels(original);
    assert.notEqual(normalized, original);
    assert.deepEqual([...normalized.values()].map(token => token[4].value), [75, 0, 0, 0]);
    assert.ok(Number.isNaN(original.get('c')[4].value));
    assert.ok(Number.isNaN(original.get('alpha')[4].value));
});

test('display conversion removes powerless hue or chroma without mutating channels', () => {
    const gray = [40, 0, 60];
    const hsl = convertPowerlessComponentsToZeroValuesForDisplay(gray, ColorNotation.HSL);
    assert.ok(Number.isNaN(hsl[0]));
    assert.deepEqual(hsl.slice(1), [0, 60]);
    assert.deepEqual(gray, [40, 0, 60]);

    const white = convertPowerlessComponentsToZeroValuesForDisplay([40, 70, 100], ColorNotation.HSL);
    assert.ok(Number.isNaN(white[0]));
    assert.ok(Number.isNaN(white[1]));
    assert.equal(white[2], 100);
    const lch = convertPowerlessComponentsToZeroValuesForDisplay([50, 0, 120], ColorNotation.LCH);
    assert.ok(Number.isNaN(lch[2]));
});

test('XYZ gamut mapping keeps in-gamut RGB and bounds wide-gamut colors', () => {
    const ordinary = colorData_to_XYZ_D50(data(ColorNotation.RGB, [0.2, 0.4, 0.6]));
    const recovered = XYZ_D50_to_sRGB_Gamut(ordinary.channels);
    for (let i = 0; i < 3; i++) {
        assert.ok(Math.abs(recovered[i] - [0.2, 0.4, 0.6][i]) < 0.0001);
    }

    const wide = colorData_to_XYZ_D50(data(ColorNotation.Display_P3, [0, 1, 0]));
    const mapped = XYZ_D50_to_sRGB_Gamut(wide.channels);
    assert.equal(mapped.length, 3);
    assert.ok(mapped.every(channel => Number.isFinite(channel) && channel >= -0.000001 && channel <= 1.000001));
});
