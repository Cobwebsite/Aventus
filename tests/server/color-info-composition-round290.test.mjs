import assert from 'node:assert/strict';
import test from 'node:test';
import { ColorInfo } from '../../server/src/color-picker/ColorInfo.ts';

test('ColorInfo mix interpolates RGB channels, clamps percentages, and preserves its inputs', () => {
    const red = ColorInfo.fromHex('#ff0000');
    const blue = ColorInfo.fromHex('#0000ff');

    assert.equal(ColorInfo.mix(red, blue, 25).toHex(), '#bf0040');
    assert.equal(red.mix(blue, 50).toHex(), '#800080');
    assert.equal(ColorInfo.mix(red, blue, -20).toHex(), '#ff0000');
    assert.equal(ColorInfo.mix(red, blue, 120).toHex(), '#0000ff');
    assert.equal(red.toHex(), '#ff0000');
    assert.equal(blue.toHex(), '#0000ff');
});

test('ColorInfo add averages channels without changing its inputs', () => {
    const first = ColorInfo.fromHex('#804020');
    const second = ColorInfo.fromHex('#40a0ff');

    assert.equal(ColorInfo.add(first, second).toHex(), '#607090');
    assert.equal(first.toHex(), '#804020');
    assert.equal(second.toHex(), '#40a0ff');
});

test('ColorInfo multiply currently rejects valid colors after destructuring their RGB channels', () => {
    const first = ColorInfo.fromHex('#804020');
    const second = ColorInfo.fromHex('#40a0ff');
    assert.throws(() => first.multiply(second), /Color values out of bounds/);
    assert.equal(first.toHex(), '#804020');
    assert.equal(second.toHex(), '#40a0ff');
});
