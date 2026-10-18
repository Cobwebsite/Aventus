import assert from 'node:assert/strict';
import test from 'node:test';
import { ColorInfo } from '../../server/src/color-picker/ColorInfo.ts';

test('ColorInfo HSV conversion preserves a non-primary color and clamps its endpoint values', () => {
    const color = ColorInfo.fromHsv(210, 50, 80);
    assert.equal(color.toHex(), '#6699cc');
    assert.deepEqual(color.toHsv(), { h: 210, s: 50, v: 80 });
    assert.equal(ColorInfo.fromHsv(360, 100, 100).toHex(), '#ff0000');
    assert.equal(ColorInfo.fromHsv(0, 0, 0).toHex(), '#000000');

    for (const channels of [[-1, 50, 50], [361, 50, 50], [0, -1, 50], [0, 101, 50], [0, 50, -1], [0, 50, 101]]) {
        assert.throws(() => ColorInfo.fromHsv(...channels), /out of range/);
    }
});

test('ColorInfo CMYK conversion handles black, white and a non-primary RGB value', () => {
    assert.deepEqual(ColorInfo.fromHex('#000000').toCmyk(), { c: 0, m: 0, y: 0, k: 100 });
    assert.deepEqual(ColorInfo.fromHex('#ffffff').toCmyk(), { c: 0, m: 0, y: 0, k: 0 });
    assert.deepEqual(ColorInfo.fromHex('#336699').toCmyk(), { c: 66.67, m: 33.33, y: 0, k: 40 });
});

test('ColorInfo lerp clamps the interpolation factor and leaves input colors intact', () => {
    const dark = ColorInfo.fromHex('#000000');
    const light = ColorInfo.fromHex('#ffffff');
    assert.equal(ColorInfo.lerp(dark, light, -1).toHex(), '#000000');
    assert.equal(dark.lerp(light, 0.5).toHex(), '#808080');
    assert.equal(ColorInfo.lerp(dark, light, 2).toHex(), '#ffffff');
    assert.equal(dark.toHex(), '#000000');
    assert.equal(light.toHex(), '#ffffff');
    assert.throws(() => ColorInfo.lerp(dark, light, '0.5'), TypeError);
    assert.throws(() => ColorInfo.lerp(dark, {}, 0.5), TypeError);
});
