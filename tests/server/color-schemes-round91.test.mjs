import assert from 'node:assert/strict';
import test from 'node:test';
import { ColorInfo } from '../../server/src/color-picker/ColorInfo.ts';

const hexes = colors => colors.map(color => color.toHex());

test('named schemes expose the expected hue relationships for a primary color', () => {
    const red = ColorInfo.fromHex('#ff0000');
    assert.equal(red.getScheme('complement').toHex(), '#00ffff');
    assert.deepEqual(hexes(red.getScheme('triad')), ['#ff0000', '#00ff00', '#0000ff']);
    assert.deepEqual(hexes(red.getScheme('square')), ['#ff0000', '#80ff00', '#00ffff', '#8000ff']);
    assert.deepEqual(hexes(red.getScheme('analogous', { angle: 30 })), ['#ff0000', '#ff0080', '#ff8000']);
    assert.deepEqual(hexes(ColorInfo.getScheme(red, 'split', { angle: 30 })), ['#ff0000', '#0080ff', '#00ff80']);
});

test('scheme aliases and unknown names preserve the public return shapes', () => {
    const base = ColorInfo.fromHex('#ff0000');
    assert.deepEqual(hexes(base.getScheme('DOUBLE')), hexes(base.doubleComplementary()));
    assert.deepEqual(hexes(base.getScheme('TETRA')), hexes(base.tetradic()));
    assert.equal(base.getScheme('missing'), null);
    assert.throws(() => ColorInfo.getScheme({}, 'triadic'), TypeError);
});
