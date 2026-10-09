import assert from 'node:assert/strict';
import test from 'node:test';
import { ColorInfo } from '../../server/src/color-picker/ColorInfo.ts';
import {
    ColorNotation,
    colorDataFitsDisplayP3_Gamut,
    colorDataFitsRGB_Gamut,
    colorDataTo,
    convertNaNToZero,
    toPrecision,
} from '../../server/src/color-picker/ColorData.ts';

test('ColorInfo parses short and long hex and formats RGB', () => {
    assert.equal(ColorInfo.fromHex('#f80').toHex(), '#ff8800');
    assert.equal(ColorInfo.fromHex('336699').toString('rgb'), 'rgb(51, 102, 153)');
    assert.deepEqual(ColorInfo.fromName('red').toRgb(), { r: 255, g: 0, b: 0 });
});

test('ColorInfo rejects invalid colors and converts primary HSL colors', () => {
    assert.throws(() => ColorInfo.fromHex('#12'), /Invalid Hex code/);
    assert.throws(() => ColorInfo.fromName('not-a-color'), /Invalid Color name/);
    assert.throws(() => new ColorInfo(256, 0, 0), /out of bounds/);
    assert.throws(() => ColorInfo.fromHsl(361, 100, 50), /out of range/);
    assert.equal(ColorInfo.fromHsl(120, 100, 50).toHex(), '#00ff00');
});

test('ColorData converts between RGB and HSL without changing the input', () => {
    const original = {
        colorNotation: ColorNotation.RGB,
        channels: [1, 0, 0],
        alpha: 0.5,
        syntaxFlags: new Set(),
    };
    const hsl = colorDataTo(original, ColorNotation.HSL);
    assert.equal(hsl.colorNotation, ColorNotation.HSL);
    assert.ok(Math.abs(hsl.channels[0]) < 0.001);
    assert.ok(Math.abs(hsl.channels[1] - 100) < 0.001);
    assert.ok(Math.abs(hsl.channels[2] - 50) < 0.001);
    assert.equal(hsl.alpha, 0.5);
    assert.deepEqual(original.channels, [1, 0, 0]);

    const roundTrip = colorDataTo(hsl, ColorNotation.RGB);
    roundTrip.channels.forEach((channel, index) => {
        assert.ok(Math.abs(channel - original.channels[index]) < 0.001);
    });
});

test('ColorData handles missing channels and gamut checks', () => {
    assert.deepEqual(convertNaNToZero([NaN, 0.25, NaN]), [0, 0.25, 0]);
    const inGamut = { colorNotation: ColorNotation.RGB, channels: [0.5, 0.2, 0.8], alpha: 1, syntaxFlags: new Set() };
    const outOfGamut = { ...inGamut, channels: [2, 0, 0] };
    assert.equal(colorDataFitsRGB_Gamut(inGamut), true);
    assert.equal(colorDataFitsDisplayP3_Gamut(inGamut), true);
    assert.equal(colorDataFitsRGB_Gamut(outOfGamut), false);
    assert.deepEqual(inGamut.channels, [0.5, 0.2, 0.8]);
});

test('ColorData rounds ordinary numbers to the requested precision', () => {
    assert.equal(toPrecision(1234.567, 4), 1235);
    assert.equal(toPrecision(0.123456789, 4), 0.1235);
    assert.equal(toPrecision(-0.123456789, 4), -0.1235);
    assert.equal(toPrecision(0, 4), 0);
});
