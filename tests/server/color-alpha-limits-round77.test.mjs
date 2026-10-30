import assert from 'node:assert/strict';
import test from 'node:test';
import { color } from '@csstools/css-color-parser';
import { parseComponentValue } from '@csstools/css-parser-algorithms';
import { tokenize } from '@csstools/css-tokenizer';
import { ColorInfo } from '../../server/src/color-picker/ColorInfo.ts';
import {
    ColorNotation, SyntaxFlag, colorDataTo, colorDataFitsRGB_Gamut,
} from '../../server/src/color-picker/ColorData.ts';

function parse(css) {
    const parsed = color(parseComponentValue(tokenize({ css })));
    assert.notEqual(parsed, false, css);
    return parsed;
}

test('short and long hexadecimal alpha channels survive conversion without changing their source flags', () => {
    for (const [css, alpha] of [['#f008', 136 / 255], ['#ff000080', 128 / 255], ['#0000', 0], ['#ffffffff', 1]]) {
        const source = parse(css);
        assert.equal(source.syntaxFlags.has(SyntaxFlag.HasAlpha), true, css);
        assert.ok(Math.abs(source.alpha - alpha) < 1e-8, css);
        const lab = colorDataTo(source, ColorNotation.Lab);
        const rgb = colorDataTo(lab, ColorNotation.RGB);
        assert.equal(lab.alpha, source.alpha, css);
        assert.equal(rgb.alpha, source.alpha, css);
        assert.equal(rgb.syntaxFlags, source.syntaxFlags, css);
    }
});

test('CSS alpha percentages at their endpoints and an intermediate value survive HSL to RGB conversion', () => {
    for (const [css, expected] of [
        ['hsl(120 100% 50% / 0%)', 0],
        ['hsl(120 100% 50% / 25%)', 0.25],
        ['hsl(120 100% 50% / 100%)', 1],
    ]) {
        const source = parse(css);
        assert.equal(source.syntaxFlags.has(SyntaxFlag.HasPercentageAlpha), true, css);
        assert.equal(source.alpha, expected, css);
        const converted = colorDataTo(source, ColorNotation.RGB);
        assert.equal(converted.alpha, expected, css);
        assert.ok(Math.abs(converted.channels[1] - 1) < 1e-4, css);
    }
});

test('RGB gamut includes exact endpoints and rejects negative or excess channels independently of alpha', () => {
    for (const channels of [[0, 0, 0], [1, 1, 1], [0, 1, 0]]) {
        for (const alpha of [0, 0.5, 1]) {
            assert.equal(colorDataFitsRGB_Gamut({ colorNotation: ColorNotation.RGB, channels, alpha, syntaxFlags: new Set() }), true);
        }
    }
    for (const channels of [[-0.1, 0, 0], [0, 1.1, 0], [0, 0, -0.1]]) {
        assert.equal(colorDataFitsRGB_Gamut({ colorNotation: ColorNotation.RGB, channels, alpha: 0.5, syntaxFlags: new Set() }), false);
    }
});

test('ColorInfo accepts RGB endpoint values and rejects out-of-range inputs', () => {
    assert.equal(new ColorInfo(0, 0, 0).toHex(), '#000000');
    assert.equal(new ColorInfo(255, 255, 255).toHex(), '#ffffff');
    for (const channels of [[-1, 0, 0], [0, 256, 0], [0, 0, Infinity]]) {
        assert.throws(() => new ColorInfo(...channels), /out of bounds/);
    }
});
