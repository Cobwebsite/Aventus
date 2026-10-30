export class ColorInfo {

	private static tc(value, type) {
		if (!(typeof value == type)) throw new TypeError(`required type ${type} got ${typeof value}`);
		return value
	}

	private static ic(value, type) {
		if (!(value instanceof type)) throw new TypeError(`required type ${type} got ${typeof value}`);
		return value
	}

	private static nc(value): number {
		if (isNaN(value)) return 0;
		return value;
	}

	#red: number;

	#green: number;

	#blue: number;

	alpha: number;

	static Colors = class {
		static get BLACK() { return ColorInfo.fromHex("#000000"); }
		static get SILVER() { return ColorInfo.fromHex("#c0c0c0"); }
		static get GRAY() { return ColorInfo.fromHex("#808080"); }
		static get WHITE() { return ColorInfo.fromHex("#ffffff"); }
		static get MAROON() { return ColorInfo.fromHex("#800000"); }
		static get RED() { return ColorInfo.fromHex("#ff0000"); }
		static get PURPLE() { return ColorInfo.fromHex("#800080"); }
		static get GREEN() { return ColorInfo.fromHex("#008000"); }
		static get LIME() { return ColorInfo.fromHex("#00ff00"); }
		static get OLIVE() { return ColorInfo.fromHex("#808000"); }
		static get YELLOW() { return ColorInfo.fromHex("#ffff00"); }
		static get NAVY() { return ColorInfo.fromHex("#000080"); }
		static get BLUE() { return ColorInfo.fromHex("#0000ff"); }
		static get TEAL() { return ColorInfo.fromHex("#008080"); }
		static get AQUA() { return ColorInfo.fromHex("#00ffff"); }
		static get ORANGE() { return ColorInfo.fromHex("#ffa500"); }
		static get ALICEBLUE() { return ColorInfo.fromHex("#f0f8ff"); }
		static get ANTIQUEWHITE() { return ColorInfo.fromHex("#faebd7"); }
		static get AQUAMARINE() { return ColorInfo.fromHex("#7fffd4"); }
		static get AZURE() { return ColorInfo.fromHex("#f0ffff"); }
		static get BEIGE() { return ColorInfo.fromHex("#f5f5dc"); }
		static get BISQUE() { return ColorInfo.fromHex("#ffe4c4"); }
		static get BLANCHEDALMOND() { return ColorInfo.fromHex("#ffebcd"); }
		static get BLUEVIOLET() { return ColorInfo.fromHex("#8a2be2"); }
		static get BROWN() { return ColorInfo.fromHex("#a52a2a"); }
		static get BURLYWOOD() { return ColorInfo.fromHex("#deb887"); }
		static get CADETBLUE() { return ColorInfo.fromHex("#5f9ea0"); }
		static get CHARTREUSE() { return ColorInfo.fromHex("#7fff00"); }
		static get CHOCOLATE() { return ColorInfo.fromHex("#d2691e"); }
		static get CORAL() { return ColorInfo.fromHex("#ff7f50"); }
		static get CORNFLOWERBLUE() { return ColorInfo.fromHex("#6495ed"); }
		static get CORNSILK() { return ColorInfo.fromHex("#fff8dc"); }
		static get CRIMSON() { return ColorInfo.fromHex("#dc143c"); }
		static get CYAN() { return ColorInfo.fromHex("#00ffff"); }
		static get DARKBLUE() { return ColorInfo.fromHex("#00008b"); }
		static get DARKCYAN() { return ColorInfo.fromHex("#008b8b"); }
		static get DARKGOLDENROD() { return ColorInfo.fromHex("#b8860b"); }
		static get DARKGRAY() { return ColorInfo.fromHex("#a9a9a9"); }
		static get DARKGREEN() { return ColorInfo.fromHex("#006400"); }
		static get DARKGREY() { return ColorInfo.fromHex("#a9a9a9"); }
		static get DARKKHAKI() { return ColorInfo.fromHex("#bdb76b"); }
		static get DARKMAGENTA() { return ColorInfo.fromHex("#8b008b"); }
		static get DARKOLIVEGREEN() { return ColorInfo.fromHex("#556b2f"); }
		static get DARKORANGE() { return ColorInfo.fromHex("#ff8c00"); }
		static get DARKORCHID() { return ColorInfo.fromHex("#9932cc"); }
		static get DARKRED() { return ColorInfo.fromHex("#8b0000"); }
		static get DARKSALMON() { return ColorInfo.fromHex("#e9967a"); }
		static get DARKSEAGREEN() { return ColorInfo.fromHex("#8fbc8f"); }
		static get DARKSLATEBLUE() { return ColorInfo.fromHex("#483d8b"); }
		static get DARKSLATEGRAY() { return ColorInfo.fromHex("#2f4f4f"); }
		static get DARKSLATEGREY() { return ColorInfo.fromHex("#2f4f4f"); }
		static get DARKTURQUOISE() { return ColorInfo.fromHex("#00ced1"); }
		static get DARKVIOLET() { return ColorInfo.fromHex("#9400d3"); }
		static get DEEPPINK() { return ColorInfo.fromHex("#ff1493"); }
		static get DEEPSKYBLUE() { return ColorInfo.fromHex("#00bfff"); }
		static get DIMGRAY() { return ColorInfo.fromHex("#696969"); }
		static get DIMGREY() { return ColorInfo.fromHex("#696969"); }
		static get DODGERBLUE() { return ColorInfo.fromHex("#1e90ff"); }
		static get FIREBRICK() { return ColorInfo.fromHex("#b22222"); }
		static get FLORALWHITE() { return ColorInfo.fromHex("#fffaf0"); }
		static get FORESTGREEN() { return ColorInfo.fromHex("#228b22"); }
		static get GAINSBORO() { return ColorInfo.fromHex("#dcdcdc"); }
		static get GHOSTWHITE() { return ColorInfo.fromHex("#f8f8ff"); }
		static get GOLD() { return ColorInfo.fromHex("#ffd700"); }
		static get GOLDENROD() { return ColorInfo.fromHex("#daa520"); }
		static get GREENYELLOW() { return ColorInfo.fromHex("#adff2f"); }
		static get GREY() { return ColorInfo.fromHex("#808080"); }
		static get HONEYDEW() { return ColorInfo.fromHex("#f0fff0"); }
		static get HOTPINK() { return ColorInfo.fromHex("#ff69b4"); }
		static get INDIANRED() { return ColorInfo.fromHex("#cd5c5c"); }
		static get INDIGO() { return ColorInfo.fromHex("#4b0082"); }
		static get IVORY() { return ColorInfo.fromHex("#fffff0"); }
		static get KHAKI() { return ColorInfo.fromHex("#f0e68c"); }
		static get LAVENDER() { return ColorInfo.fromHex("#e6e6fa"); }
		static get LAVENDERBLUSH() { return ColorInfo.fromHex("#fff0f5"); }
		static get LAWNGREEN() { return ColorInfo.fromHex("#7cfc00"); }
		static get LEMONCHIFFON() { return ColorInfo.fromHex("#fffacd"); }
		static get LIGHTBLUE() { return ColorInfo.fromHex("#add8e6"); }
		static get LIGHTCORAL() { return ColorInfo.fromHex("#f08080"); }
		static get LIGHTCYAN() { return ColorInfo.fromHex("#e0ffff"); }
		static get LIGHTGOLDENRODYELLOW() { return ColorInfo.fromHex("#fafad2"); }
		static get LIGHTGRAY() { return ColorInfo.fromHex("#d3d3d3"); }
		static get LIGHTGREEN() { return ColorInfo.fromHex("#90ee90"); }
		static get LIGHTGREY() { return ColorInfo.fromHex("#d3d3d3"); }
		static get LIGHTPINK() { return ColorInfo.fromHex("#ffb6c1"); }
		static get LIGHTSALMON() { return ColorInfo.fromHex("#ffa07a"); }
		static get LIGHTSEAGREEN() { return ColorInfo.fromHex("#20b2aa"); }
		static get LIGHTSKYBLUE() { return ColorInfo.fromHex("#87cefa"); }
		static get LIGHTSLATEGRAY() { return ColorInfo.fromHex("#778899"); }
		static get LIGHTSLATEGREY() { return ColorInfo.fromHex("#778899"); }
		static get LIGHTSTEELBLUE() { return ColorInfo.fromHex("#b0c4de"); }
		static get LIGHTYELLOW() { return ColorInfo.fromHex("#ffffe0"); }
		static get LIMEGREEN() { return ColorInfo.fromHex("#32cd32"); }
		static get LINEN() { return ColorInfo.fromHex("#faf0e6"); }
		static get MAGENTA() { return ColorInfo.fromHex("#ff00ff"); }
		static get FUCHSIA() { return ColorInfo.fromHex("#ff00ff"); }
		static get MEDIUMAQUAMARINE() { return ColorInfo.fromHex("#66cdaa"); }
		static get MEDIUMBLUE() { return ColorInfo.fromHex("#0000cd"); }
		static get MEDIUMORCHID() { return ColorInfo.fromHex("#ba55d3"); }
		static get MEDIUMPURPLE() { return ColorInfo.fromHex("#9370db"); }
		static get MEDIUMSEAGREEN() { return ColorInfo.fromHex("#3cb371"); }
		static get MEDIUMSLATEBLUE() { return ColorInfo.fromHex("#7b68ee"); }
		static get MEDIUMSPRINGGREEN() { return ColorInfo.fromHex("#00fa9a"); }
		static get MEDIUMTURQUOISE() { return ColorInfo.fromHex("#48d1cc"); }
		static get MEDIUMVIOLETRED() { return ColorInfo.fromHex("#c71585"); }
		static get MIDNIGHTBLUE() { return ColorInfo.fromHex("#191970"); }
		static get MINTCREAM() { return ColorInfo.fromHex("#f5fffa"); }
		static get MISTYROSE() { return ColorInfo.fromHex("#ffe4e1"); }
		static get MOCCASIN() { return ColorInfo.fromHex("#ffe4b5"); }
		static get NAVAJOWHITE() { return ColorInfo.fromHex("#ffdead"); }
		static get OLDLACE() { return ColorInfo.fromHex("#fdf5e6"); }
		static get OLIVEDRAB() { return ColorInfo.fromHex("#6b8e23"); }
		static get ORANGERED() { return ColorInfo.fromHex("#ff4500"); }
		static get ORCHID() { return ColorInfo.fromHex("#da70d6"); }
		static get PALEGOLDENROD() { return ColorInfo.fromHex("#eee8aa"); }
		static get PALEGREEN() { return ColorInfo.fromHex("#98fb98"); }
		static get PALETURQUOISE() { return ColorInfo.fromHex("#afeeee"); }
		static get PALEVIOLETRED() { return ColorInfo.fromHex("#db7093"); }
		static get PAPAYAWHIP() { return ColorInfo.fromHex("#ffefd5"); }
		static get PEACHPUFF() { return ColorInfo.fromHex("#ffdab9"); }
		static get PERU() { return ColorInfo.fromHex("#cd853f"); }
		static get PINK() { return ColorInfo.fromHex("#ffc0cb"); }
		static get PLUM() { return ColorInfo.fromHex("#dda0dd"); }
		static get POWDERBLUE() { return ColorInfo.fromHex("#b0e0e6"); }
		static get ROSYBROWN() { return ColorInfo.fromHex("#bc8f8f"); }
		static get ROYALBLUE() { return ColorInfo.fromHex("#4169e1"); }
		static get SADDLEBROWN() { return ColorInfo.fromHex("#8b4513"); }
		static get SALMON() { return ColorInfo.fromHex("#fa8072"); }
		static get SANDYBROWN() { return ColorInfo.fromHex("#f4a460"); }
		static get SEAGREEN() { return ColorInfo.fromHex("#2e8b57"); }
		static get SEASHELL() { return ColorInfo.fromHex("#fff5ee"); }
		static get SIENNA() { return ColorInfo.fromHex("#a0522d"); }
		static get SKYBLUE() { return ColorInfo.fromHex("#87ceeb"); }
		static get SLATEBLUE() { return ColorInfo.fromHex("#6a5acd"); }
		static get SLATEGRAY() { return ColorInfo.fromHex("#708090"); }
		static get SLATEGREY() { return ColorInfo.fromHex("#708090"); }
		static get SNOW() { return ColorInfo.fromHex("#fffafa"); }
		static get SPRINGGREEN() { return ColorInfo.fromHex("#00ff7f"); }
		static get STEELBLUE() { return ColorInfo.fromHex("#4682b4"); }
		static get TAN() { return ColorInfo.fromHex("#d2b48c"); }
		static get THISTLE() { return ColorInfo.fromHex("#d8bfd8"); }
		static get TOMATO() { return ColorInfo.fromHex("#ff6347"); }
		static get TURQUOISE() { return ColorInfo.fromHex("#40e0d0"); }
		static get VIOLET() { return ColorInfo.fromHex("#ee82ee"); }
		static get WHEAT() { return ColorInfo.fromHex("#f5deb3"); }
		static get WHITESMOKE() { return ColorInfo.fromHex("#f5f5f5"); }
		static get YELLOWGREEN() { return ColorInfo.fromHex("#9acd32"); }
		static get REBECCAPURPLE() { return ColorInfo.fromHex("#663399"); }


	}

	constructor(r, g, b) {
		if (!((0 <= r && r <= 255) && (0 <= g && g <= 255) && (0 <= b && b <= 255))) throw new Error('Color values out of bounds (0 - 255)')
		this.#red = ColorInfo.nc(ColorInfo.tc(r, "number"));
		this.#green = ColorInfo.nc(ColorInfo.tc(g, "number"));
		this.#blue = ColorInfo.nc(ColorInfo.tc(b, "number"));
		this.alpha = 1;

	}

	static fromHex(hex) {
		if (!hex.match(/^#?(?:[0-9a-fA-F]{3}){1,2}$/i)) throw new Error('Invalid Hex code: "' + hex + '"');
		let r = "0x00";
		let g = "0x00";
		let b = "0x00";
		if (hex.length == 4) {
			r = "0x" + hex[1] + hex[1];
			g = "0x" + hex[2] + hex[2];
			b = "0x" + hex[3] + hex[3];
		}
		else if (hex.length == 3) {
			r = "0x" + hex[0] + hex[0];
			g = "0x" + hex[1] + hex[1];
			b = "0x" + hex[2] + hex[2];
		}
		else if (hex.length == 7) {
			r = "0x" + hex[1] + hex[2];
			g = "0x" + hex[3] + hex[4];
			b = "0x" + hex[5] + hex[6];
		}
		else if (hex.length == 6) {
			r = "0x" + hex[0] + hex[1];
			g = "0x" + hex[2] + hex[3];
			b = "0x" + hex[4] + hex[5];
		}

		const color = new ColorInfo(parseInt(r, 16), parseInt(g, 16), parseInt(b, 16));
		return color;

	}

	static fromRgb(r, g, b) {
		return new ColorInfo(r, g, b)
	}

	static fromName(colorName): ColorInfo {
		colorName = this.tc(colorName, "string")
		const color = this.Colors[colorName.toUpperCase()];
		if (!color) throw new Error('Invalid Color name');
		return color;
	}

	static toHex(color) {
		color = this.ic(color, ColorInfo);
		let r = Math.round(color.#red).toString(16);
		let g = Math.round(color.#green).toString(16);
		let b = Math.round(color.#blue).toString(16);

		if (r.length == 1) {
			r = "0" + r;
		}
		if (g.length == 1) {
			g = "0" + g;
		}
		if (b.length == 1) {
			b = "0" + b;
		}


		return "#" + r + g + b;
	}

	static toHsl(color) {
		color = this.ic(color, ColorInfo);

		let h = 0;
		let s = 0;
		let l = 0;

		let r = color.#red / 255;
		let g = color.#green / 255;
		let b = color.#blue / 255;

		let cmin = Math.min(Math.min(r, g), b);
		let cmax = Math.max(Math.max(r, g), b);
		let delta = cmax - cmin;

		if (delta === 0) {
			h = 0;
		}

		else if (cmax === r) {
			h = ((g - b) / delta) % 6;
		}

		else if (cmax === g) {
			h = (b - r) / delta + 2;
		}

		else {
			h = (r - g) / delta + 4;
		}

		h = Math.round(h * 60);

		if (h < 0) {
			h += 360;
		}

		l = (cmax + cmin) / 2;
		s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
		s = parseFloat(Math.abs(s * 100) + '');
		l = parseFloat(Math.abs(l * 100) + '');

		return { h: this.nc(h), s: this.nc(s), l: this.nc(l) };

	}

	static toRgb(color) {
		this.ic(color, ColorInfo);
		return { r: color.#red, g: color.#green, b: color.#blue };
	}

	toHsl() {
		return ColorInfo.toHsl(this);
	}

	toHex() {
		return ColorInfo.toHex(this);
	}

	toRgb() {
		return ColorInfo.toRgb(this);
	}

	toString(type = "hex"): string {
		ColorInfo.tc(type, "string");
		const rgb = this.toRgb();
		const hsl = this.toHsl();
		switch (type.toLowerCase()) {
			case "hex":
				return this.toHex();
			case "hexa": {
				let alpha = Math.round(this.alpha * 255).toString(16);
				if (alpha.length === 1) alpha = "0" + alpha;
				return this.toHex() + alpha;
			}
			case "rgb":
				return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
			case "rgba":
				return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${this.alpha})`;
			case "hsl":
				return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
			case "hsla":
				return `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%, ${this.alpha})`;
			default:
				return "";
		}
	}
}
