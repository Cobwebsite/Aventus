import assert from 'node:assert/strict';
import test from 'node:test';
import {
    ColorNotation, SyntaxFlag, colorDataTo, colorData_to_XYZ_D50,
    colorDataFitsRGB_Gamut, colorDataFitsDisplayP3_Gamut,
} from '../../server/src/color-picker/ColorData.ts';

function rgb(channels = [0.25, 0.5, 0.75]) {
    return { colorNotation: ColorNotation.RGB, channels, alpha: 0.4,
        syntaxFlags: new Set([SyntaxFlag.HasAlpha]) };
}

test('wide-gamut and perceptual color spaces round-trip through RGB', () => {
    const original = rgb();
    const spaces = [
        ColorNotation.Display_P3, ColorNotation.Linear_Display_P3,
        ColorNotation.A98_RGB, ColorNotation.ProPhoto_RGB, ColorNotation.Rec2020,
        ColorNotation.Lab, ColorNotation.LCH, ColorNotation.OKLab, ColorNotation.OKLCH,
        ColorNotation.XYZ_D50, ColorNotation.XYZ_D65,
    ];
    for (const space of spaces) {
        const converted = colorDataTo(original, space);
        const recovered = colorDataTo(converted, ColorNotation.RGB);
        assert.equal(converted.colorNotation, space);
        assert.equal(recovered.alpha, 0.4);
        assert.equal(recovered.syntaxFlags, original.syntaxFlags);
        for (let i = 0; i < 3; i++) {
            assert.ok(Math.abs(recovered.channels[i] - original.channels[i]) < 0.0001,
                `${space} channel ${i}: ${recovered.channels[i]} vs ${original.channels[i]}`);
        }
    }
    assert.deepEqual(original.channels, [0.25, 0.5, 0.75]);
});

test('missing RGB components are carried through another RGB space and preserved on a no-op conversion', () => {
    const source = rgb([NaN, 0.5, 0.75]);
    const same = colorDataTo(source, ColorNotation.RGB);
    assert.ok(Number.isNaN(same.channels[0]));
    assert.deepEqual(same.channels.slice(1), [0.5, 0.75]);
    const p3 = colorDataTo(source, ColorNotation.Display_P3);
    assert.ok(Number.isNaN(p3.channels[0]));
    assert.ok(Number.isFinite(p3.channels[1]));
    assert.ok(Number.isFinite(p3.channels[2]));
    assert.ok(Number.isNaN(source.channels[0]));
});

test('gamut checks distinguish colors outside sRGB but inside Display P3', () => {
    const p3 = { colorNotation: ColorNotation.Display_P3,
        channels: [0, 1, 0], alpha: 1, syntaxFlags: new Set() };
    assert.equal(colorDataFitsDisplayP3_Gamut(p3), true);
    assert.equal(colorDataFitsRGB_Gamut(p3), false);
    const xyz = colorData_to_XYZ_D50(p3);
    assert.equal(xyz.colorNotation, ColorNotation.XYZ_D50);
    assert.equal(colorDataFitsDisplayP3_Gamut(xyz), true);
});
