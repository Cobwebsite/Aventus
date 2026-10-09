import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { color } from '@csstools/css-color-parser';
import { parseComponentValue } from '@csstools/css-parser-algorithms';
import { tokenize } from '@csstools/css-tokenizer';
import {
    ColorNotation, colorDataTo, colorDataFitsRGB_Gamut,
    colorDataFitsDisplayP3_Gamut,
} from '../../server/src/color-picker/ColorData.ts';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

function parse(css) {
    const result = color(parseComponentValue(tokenize({ css })));
    assert.notEqual(result, false, `CSS color must parse: ${css}`);
    return result;
}

function near(actual, expected, tolerance = 1e-4) {
    assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
}

test('equivalent modern RGB, HSL and color() syntax retains alpha through XYZ and sRGB', () => {
    const spellings = [
        'rgb(255 0 0 / 50%)',
        'hsl(0 100% 50% / 0.5)',
        'color(srgb 1 0 0 / 0.5)',
        'color(display-p3 0.9175 0.2003 0.1386 / 0.5)',
    ];
    for (const spelling of spellings) {
        const parsed = parse(spelling);
        const srgb = colorDataTo(parsed, ColorNotation.sRGB);
        near(srgb.channels[0], 1, spelling.startsWith('color(display-p3') ? 0.003 : 1e-4);
        near(srgb.channels[1], 0, spelling.startsWith('color(display-p3') ? 0.003 : 1e-4);
        near(srgb.channels[2], 0, spelling.startsWith('color(display-p3') ? 0.003 : 1e-4);
        near(srgb.alpha, 0.5);
        assert.equal(srgb.syntaxFlags, parsed.syntaxFlags);
    }
});

test('sRGB and Display P3 gamut decisions survive conversion through XYZ D65', () => {
    for (const spelling of ['color(srgb 0 0 0)', 'color(srgb 1 1 1)', 'rgb(25% 50% 75%)']) {
        const source = parse(spelling);
        const d65 = colorDataTo(source, ColorNotation.XYZ_D65);
        assert.equal(colorDataFitsRGB_Gamut(source), true, spelling);
        assert.equal(colorDataFitsDisplayP3_Gamut(d65), true, spelling);
        const recovered = colorDataTo(d65, ColorNotation.sRGB);
        const original = colorDataTo(source, ColorNotation.sRGB);
        recovered.channels.forEach((channel, index) => near(channel, original.channels[index]));
    }

    const vividP3 = parse('color(display-p3 0 1 0)');
    const vividD65 = colorDataTo(vividP3, ColorNotation.XYZ_D65);
    assert.equal(colorDataFitsRGB_Gamut(vividD65), false);
    assert.equal(colorDataFitsDisplayP3_Gamut(vividD65), true);
});

test('color picker finds legacy and modern CSS syntax with exact ranges', () => {
    const css = '\n.x { a: rgb(255, 0, 0); b: rgb(255 0 0); c: color(srgb 1 0 0); }';
    const document = TextDocument.create('file:///colors.wcs.avt', 'scss', 1, css);
    const found = ColorPicker.onDocumentColor(document);
    assert.deepEqual(found.map(item => document.getText(item.range)), [
        'rgb(255, 0, 0)', 'rgb(255 0 0)', 'color(srgb 1 0 0)',
    ]);
    assert.ok(found.every(item => item.color.red === 1 && item.color.green === 0 && item.color.blue === 0));
});

test('color picker finds modern HSL, Oklab and Oklch while rejecting malformed values', () => {
    const values = [
        'hsl(120 100% 50% / 0.5)',
        'oklab(0.627955 0.224863 0.125846)',
        'oklch(0.627955 0.257683 29.234)',
        'color(srgb 1 0 0 / 0.5)',
    ];
    const css = `.x { a: ${values[0]}; b: ${values[1]}; c: ${values[2]}; d: ${values[3]}; e: rgb(nope); }`;
    const document = TextDocument.create('file:///colors.wcs.avt', 'scss', 1, css);
    const found = ColorPicker.onDocumentColor(document);
    assert.deepEqual(found.map(item => document.getText(item.range)), values);
    assert.equal(found[0].color.alpha, 0.5);
    assert.equal(found[3].color.alpha, 0.5);
});
