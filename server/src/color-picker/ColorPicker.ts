import { ColorInfo } from './ColorInfo';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Color, ColorInformation, ColorPresentation, Position, Range } from 'vscode-languageserver';
import { color as colorParser } from '@csstools/css-color-parser';
import { parseComponentValue } from '@csstools/css-parser-algorithms';
import { tokenize } from '@csstools/css-tokenizer';
import { colorData_to_XYZ_D50, toPrecision, XYZ_D50_to_sRGB_Gamut } from './ColorData';
import { GenericServer } from '../GenericServer';


interface Match {
	color: Color;
	type: string;
	length: number;
	range: Range;
}




export class ColorPicker {

	private static colorTxtList: string[] = [];
	private static parseColorString(color: string) {
		try {
			const value = parseComponentValue(tokenize({ css: color }));
			if (!value) {
				return null;
			}
			const colorData = colorParser(value);
			if (colorData === false) {
				return null;
			}
			const srgb = XYZ_D50_to_sRGB_Gamut(colorData_to_XYZ_D50(colorData).channels);
			const r = Math.min(255, Math.max(0, Math.round(toPrecision(srgb[0]) * 255)));
			const g = Math.min(255, Math.max(0, Math.round(toPrecision(srgb[1]) * 255)));
			const b = Math.min(255, Math.max(0, Math.round(toPrecision(srgb[2]) * 255)));
			let a = 1;
			if (typeof colorData.alpha === 'number') {
				a = Math.min(1, Math.max(0, toPrecision(Number.isNaN(colorData.alpha) ? 0 : colorData.alpha)));
			}
			return Color.create(r / 255, g / 255, b / 255, a);


		} catch (e) {
			GenericServer.error(e);
			return null;
		}

	}
	private static getPos(text: string, index: number): Position {
		const before = text.slice(0, index);
		const lineNumber = (before.match(/\n/g) ?? []).length;
		const lastNewline = before.lastIndexOf('\n');
		return Position.create(lineNumber, index - lastNewline - 1);
	}
	private static maskCommentsAndStrings(text: string): string {
		const masked = text.split('');
		let state: 'code' | 'comment' | 'string' = 'code';
		let quote = '';
		for (let i = 0; i < text.length; i++) {
			const current = text[i];
			const next = text[i + 1];
			if (state === 'code') {
				if (current === '/' && next === '*') {
					state = 'comment';
					masked[i] = masked[++i] = ' ';
				} else if (current === '"' || current === "'") {
					state = 'string';
					quote = current;
					masked[i] = ' ';
				}
			} else {
				masked[i] = current === '\n' || current === '\r' ? current : ' ';
				if (state === 'comment' && current === '*' && next === '/') {
					masked[++i] = ' ';
					state = 'code';
				} else if (state === 'string' && current === '\\') {
					if (next !== undefined) masked[++i] = next === '\n' || next === '\r' ? next : ' ';
				} else if (state === 'string' && current === quote) {
					state = 'code';
				}
			}
		}
		return masked.join('');
	}

	static getMatches(text: string): Match[] {
		let result: Match[] = [];
		const searchable = this.maskCommentsAndStrings(text);
		const candidates: { index: number, value: string }[] = [];
		for (const match of searchable.matchAll(/#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})\b/gi)) {
			candidates.push({ index: match.index, value: match[0] });
		}
		for (const match of searchable.matchAll(/\b(?:rgba?|hsla?|oklab|oklch|color)\(/gi)) {
			let depth = 1;
			let end = match.index + match[0].length;
			for (; end < searchable.length && depth > 0; end++) {
				if (searchable[end] === '(')
					depth++;
				else if (searchable[end] === ')')
					depth--;
			}
			if (depth === 0) {
				candidates.push({ index: match.index, value: searchable.slice(match.index, end) });
			}
		}
		candidates.sort((a, b) => a.index - b.index);
		for (const candidate of candidates) {
			const t = candidate.value;
			const length = t.length;
			let type = t.startsWith('#') ? 'hex' : t.slice(0, t.indexOf('(')).toLowerCase();

			const range = Range.create(
				this.getPos(text, candidate.index),
				this.getPos(text, candidate.index + t.length)
			);

			const col = this.parseColorString(t);


			if (col) {
				result.push({
					color: col,
					type,
					length,
					range
				} as Match);
			}
		}

		if (this.colorTxtList.length == 0) {
			let colorsProps = Object.getOwnPropertyNames(ColorInfo.Colors)
			let colors: string[] = [];
			for (let prop of colorsProps) {
				if (prop != 'name' && prop != 'length' && prop != 'prototype') {
					colors.push(prop);
				}
			}
			this.colorTxtList = colors;
		}
		let regex = new RegExp("(?<![\\w\\d.\"'&$-])(" + this.colorTxtList.join("|") + ")(?![-\\w\\d])", "gi");
		const matchesNamed = searchable.matchAll(regex);
		if (matchesNamed) {
			for (let match of matchesNamed) {
				const t = match[0];
				if (match.index === undefined) {
					continue;
				}
				const length = t.length;
				let type: string = "hex";

				const range = Range.create(
					this.getPos(text, match.index),
					this.getPos(text, match.index + t.length)
				);

				const col = this.parseColorString(ColorInfo.fromName(t).toHex());

				if (col) {
					result.push({
						color: col,
						type,
						length,
						range
					} as Match);
				}
			}
		}

		return result;
	}

	static onDocumentColor(document: TextDocument) {
		const matches = ColorPicker.getMatches(document.getText());

		return matches.map(match => ColorInformation.create(
			match.range,
			match.color
		));
	}
	static onColorPresentations(document: TextDocument, range: Range, color: Color) {
		let c = ColorInfo.fromRgb(color.red * 255, color.green * 255, color.blue * 255);
		c.alpha = color.alpha;
		let colString = document.getText(range);
		let t = colString;


		const presentationHex = ColorPresentation.create(c.toString('hex'));
		const presentationHexa = ColorPresentation.create(c.toString('hexa'));
		const presentationHsl = ColorPresentation.create(c.toString('hsl'));
		const presentationHsla = ColorPresentation.create(c.toString('hsla'));
		const presentationRgb = ColorPresentation.create(c.toString('rgb'));
		const presentationRgba = ColorPresentation.create(c.toString('rgba'));

		let hasAlpha = false;
		if (t.startsWith('#') && (t.length === 9)) {
			hasAlpha = true;
		}
		if (t.startsWith('hsla')) {
			hasAlpha = true;
		}
		if (t.startsWith('rgba')) {
			hasAlpha = true;
		}
		if (color.alpha !== 1) {
			hasAlpha = true;
		}

		let withAlpha = [
			presentationHexa,
			presentationHsla,
			presentationRgba
		];

		let withoutAlpha = [
			presentationHex,
			presentationHsl,
			presentationRgb
		];


		return hasAlpha ? withAlpha : withoutAlpha;
	}
}
