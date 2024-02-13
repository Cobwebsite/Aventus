import { ColorInfo } from './ColorInfo';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Color, ColorInformation, ColorPresentation, Position, Range } from 'vscode-languageserver';
import * as parseColor from 'parse-color';

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
			const p = parseColor(color);
			if (!p) { throw new Error('invalid color string'); }
			const r = p.rgba[0];
			const g = p.rgba[1];
			const b = p.rgba[2];
			const a = p.rgba[3];

			return Color.create(r / 255, g / 255, b / 255, a);


		} catch (e) {
			console.log(e);
			return null;
		}

	}
	private static getPos(text: string, index: number): Position {

		const nMatches = Array.from(text.slice(0, index).matchAll(/\n/g));

		const lineNumber = nMatches.length;
		let lastMatch = nMatches[lineNumber - 1];
		let indexMatch = 0;
		if (lastMatch.index) {
			indexMatch = lastMatch.index;
		}
		const characterIndex = index - indexMatch;


		return Position.create(
			lineNumber,
			characterIndex - 1
		);
	}

	static getMatches(text: string): Match[] {
		let result: Match[] = [];
		const matches = text.matchAll(/(#(?:[\da-f]{3,4}){2}|#(?:[\da-f]{3})|rgb\((?:\d{1,3},\s*){2}\d{1,3}\)|rgba\((?:\d{1,3},\s*){3}\d*\.?\d+\)|hsl\(\d{1,3}(?:,\s*\d{1,3}%){2}\)|hsla\(\d{1,3}(?:,\s*\d{1,3}%){2},\s*\d*\.?\d+\))/gi);
		if (matches) {
			for (let match of matches) {
				const t = match[0];
				if (!match.index) {
					continue;
				}
				const length = t.length;
				let type: string = "";
				if (t.startsWith('hsl(')) { type = "hsl"; }
				else if (t.startsWith('hsla(')) { type = "hsla"; }
				else if (t.startsWith('rgb(')) { type = "rgb"; }
				else if (t.startsWith('rgba(')) { type = "rgba"; }
				else if (t.startsWith('#')) { type = "hex"; }

				const range = Range.create(
					this.getPos(text, match.index),
					this.getPos(text, match.index + t.length)
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
		let regex = new RegExp("(?<![\\w\\d.\"'&$-])("+ this.colorTxtList.join("|") +")(?![-\\w\\d])", "gi");
		const matchesNamed = text.matchAll(regex);
		if (matchesNamed) {
			for (let match of matchesNamed) {
				const t = match[0];
				if (!match.index) {
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
		let hex = c.toString('hex');
		let hsl = c.toString('hsl');
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
