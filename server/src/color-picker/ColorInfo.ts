export class ColorInfo {

	/**
	 * 
	 * @param {Any} value 
	 * @param {type} type 
	 */
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

	private static oc(options) {
		const new_options = {
			angle: options ? (options.angle ? options.angle : 15) : 15,
			results: options ? (options.results ? options.results : 3) : 3,
		}
		return new_options
	}

	private static clmp(value, max, min) {
		if (min !== undefined && value < min) {
			return min;
		}
		if (value > max) {
			return max;
		}
		return value;
	}

	private static shift(h, angle) {
		h += angle;
		while (h >= 360.0) h -= 360.0;
		while (h < 0.0) h += 360.0;
		return h;
	}


	#red: number;
	#green: number;
	#blue: number;
	alpha: number;

	//#region color names

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

	//#endregion color names

	//#region scheme

	getScheme(name, options) {
		return ColorInfo.createScheme(this, name, options)
	}

	static getScheme(color, name, options) {
		return ColorInfo.createScheme(color, name, options)
	}

	/**
	 * 
	 * @param {ColorInfo} color 
	 * @param {Object} options 
	 * @returns Color[]
	 */
	static monochromatic(color, options) {
		this.ic(color, ColorInfo);
		let results = this.oc(options).results || 3;
		let hsv = ColorInfo.toHsv(color);
		let h = hsv.h,
			s = hsv.s,
			v = hsv.v / 100;
		let result: ColorInfo[] = [];
		let mod = 1 / results;


		while (results--) {
			result.push(ColorInfo.fromHsv(h, s, this.clmp(v * 100, 100, 0)));
			v = (v - mod) % 1;
		}

		return result;
	}

	monochromatic(options) {
		return ColorInfo.monochromatic(this, options);
	}

	/**
	 * 
	 * @param {ColorInfo} color 
	 * @returns Color
	 */
	static complementary(color) {
		this.ic(color, ColorInfo);
		let hsl = ColorInfo.toHsl(color);
		let h = hsl.h,
			s = hsl.s,
			l = hsl.l;

		return ColorInfo.fromHsl(this.shift(h, 180), s, l)

	}

	complementary() {
		return ColorInfo.complementary(this);
	}

	/**
	 * 
	 * @param {ColorInfo} color 
	 * @param {Object} options
	 * @returns Color[3]
	 */
	static splitComplementary(color, options) {
		this.ic(color, ColorInfo);
		let hsl = ColorInfo.toHsl(color);
		let angle = this.oc(options).angle || 15;
		let h = hsl.h,
			s = hsl.s,
			l = hsl.l;

		const result = [
			color,
			ColorInfo.fromHsl(this.shift(h, 180 + angle), s, l),
			ColorInfo.fromHsl(this.shift(h, 180 - angle), s, l),
		]

		return result;

	}

	splitComplementary(options) {
		return ColorInfo.splitComplementary(this, options);
	}

	/**
	 * 
	 * @param {ColorInfo} color 
	 * @param {Object} options
	 * @returns Color[4]
	*/
	static doubleComplementary(color, options) {
		this.ic(color, ColorInfo);
		let hsl = ColorInfo.toHsl(color);
		let angle = this.oc(options).angle || 15;
		let h = hsl.h,
			s = hsl.s,
			l = hsl.l;
		const result = [
			color,
			ColorInfo.fromHsl(this.shift(h, 180), s, l),
			ColorInfo.fromHsl(this.shift(h, angle), s, l),
			ColorInfo.fromHsl(this.shift(h, 180 + angle), s, l),
		]
		return result
	}

	doubleComplementary(options) {
		return ColorInfo.doubleComplementary(this, options)
	}

	/**
	 * 
	 * @param {ColorInfo} color 
	 * @returns Color[4]
	*/
	static square(color) {
		this.ic(color, ColorInfo);
		let hsl = ColorInfo.toHsl(color);
		let h = hsl.h,
			s = hsl.s,
			l = hsl.l;
		const result = [color]

		for (let i = 1; i < 4; i++) {
			h = this.shift(h, 90);
			result.push(ColorInfo.fromHsl(h, s, l));
		}

		return result
	}

	square() {
		return ColorInfo.square(this)
	}

	/**
	 * 
	 * @param {ColorInfo} color 
	 * @param {Object} options
	 * @returns Color[4]
	*/
	static tetradic(color, options) {
		this.ic(color, ColorInfo);
		let hsl = ColorInfo.toHsl(color);
		let angle = this.oc(options).angle;
		let h = hsl.h,
			s = hsl.s,
			l = hsl.l;
		return [
			color,
			ColorInfo.fromHsl(this.shift(h, 180), s, l),
			ColorInfo.fromHsl(this.shift(h, 180 - angle), s, l),
			ColorInfo.fromHsl(this.shift(h, -angle), s, l)
		]
	}

	tetradic(options) {
		return ColorInfo.tetradic(this, options)
	}


	/**
	 * 
	 * @param {ColorInfo} color 
	 * @returns Color[3]
	*/
	static triadic(color) {
		this.ic(color, ColorInfo);
		let hsl = ColorInfo.toHsl(color);
		let h = hsl.h,
			s = hsl.s,
			l = hsl.l;
		return [
			color,
			ColorInfo.fromHsl(this.shift(h, 120), s, l),
			ColorInfo.fromHsl(this.shift(h, 240), s, l)
		]
	}

	triadic() {
		return ColorInfo.triadic(this)
	}

	/**
	 * 
	 * @param {ColorInfo} color 
	 * @param {Object} options
	 * @returns Color[3]
	*/
	static analogous(color, options) {
		this.ic(color, ColorInfo);
		let hsl = ColorInfo.toHsl(color);
		let angle = this.oc(options).angle;
		let h = hsl.h,
			s = hsl.s,
			l = hsl.l;
		return [
			color,
			ColorInfo.fromHsl(this.shift(h, -angle), s, l),
			ColorInfo.fromHsl(this.shift(h, +angle), s, l)
		]
	}

	analogous(options) {
		return ColorInfo.analogous(this, options)
	}

	// static materialPalette(color, options) {
	// 	var opt = oc(options);
	// 	var baseLight = opt.baseLight;
	// 	var baseDark = opt.baseDark === "self" || !opt.baseDark ? this.multiply(color, color) : opt.baseDark;

	// 	return {
	// 		"50": Color.mix(baseLight, color, 10),
	// 		"100": Color.mix(baseLight, color, 30),
	// 		"200": Color.mix(baseLight, color, 50),
	// 		"300": Color.mix(baseLight, color, 70),
	// 		"400": Color.mix(baseLight, color, 85),
	// 		"500": Color.mix(baseLight, color, 100),
	// 		"600": Color.mix(baseDark, color, 92),
	// 		"700": Color.mix(baseDark, color, 83),
	// 		"800": Color.mix(baseDark, color, 74),
	// 		"900": Color.mix(baseDark, color, 65),

	// 		"A100": Color.lighten(Color.saturate(Color.mix(baseDark, color, 15), 80), 65),
	// 		"A200": Color.lighten(Color.saturate(Color.mix(baseDark, color, 15), 80), 55),
	// 		"A400": Color.lighten(Color.saturate(Color.mix(baseLight, color, 100), 55), 10),
	// 		"A700": Color.lighten(Color.saturate(Color.mix(baseDark, color, 83), 65), 10)
	// 	};
	// }

	// materialPalette(options) {
	// 	return Color.materialPalette(this, options);
	// }



	/**
	 * 
	 * @param {ColorInfo} color 
	 * @param {string} name 
	 * @param {object} options 
	 * @returns 
	 */
	static createScheme(color, name, options): ColorInfo[] | ColorInfo | null {
		switch (name.toLowerCase()) {
			case "analogous":
			case "analog": return ColorInfo.analogous(color, options);

			case "triadic":
			case "triad": return ColorInfo.triadic(color);

			case "tetradic":
			case "tetra": return ColorInfo.tetradic(color, options);

			case "monochromatic":
			case "monochrome":
			case "mono": return ColorInfo.monochromatic(color, options);

			case "complementary":
			case "complement":
			case "comp": return ColorInfo.complementary(color);

			case "double-complementary":
			case "double-complement":
			case "double": return ColorInfo.doubleComplementary(color, options);

			case "split-complementary":
			case "split-complement":
			case "split": return ColorInfo.splitComplementary(color, options);

			case "square": return ColorInfo.square(color);
			// case "material": return Color.materialPalette(color, options);
		}
		return null;
	}

	//#endregion

	/**
	 * 
	 * @param {Number} r 
	 * @param {Number} g 
	 * @param {Number} b 
	 */
	constructor(r, g, b) {
		if (!((0 <= r && r <= 255) && (0 <= g && g <= 255) && (0 <= b && b <= 255))) throw new Error('Color values out of bounds (0 - 255)')
		this.#red = ColorInfo.nc(ColorInfo.tc(r, "number"));
		this.#green = ColorInfo.nc(ColorInfo.tc(g, "number"));
		this.#blue = ColorInfo.nc(ColorInfo.tc(b, "number"));
		this.alpha = 1;

	}

	//#region mix methods
	/**
	 * 
	 * @param {ColorInfo} color 
	 * @param {Number} amount 
	 * @returns Color
	 */
	static saturate(color, amount) {
		this.ic(color, ColorInfo);
		this.tc(amount, "number")
		let hsl = color.toHsl();
		let h = hsl.h;
		let s = this.clmp(hsl.s + amount, 100, 0);
		let l = hsl.l;
		return ColorInfo.fromHsl(h, s, l);
	}

	/**
	 * 
	 * @param {Number} amount 
	 * @returns Color 
	 */
	saturate(amount) {
		return ColorInfo.saturate(this, amount);
	}
	/**
	 * 
	 * @param {ColorInfo} color 
	 * @param {Number} amount 
	 * @returns Color
	 */
	static desaturate(color, amount) {
		this.ic(color, ColorInfo);
		this.tc(amount, "number")
		let hsl = color.toHsl();
		let h = hsl.h;
		let s = this.clmp(hsl.s - amount, 100, 0);
		let l = hsl.l;
		return ColorInfo.fromHsl(h, s, l);
	}

	/**
	 * 
	 * @param {Number} amount 
	 * @returns Color 
	 */
	desaturate(amount) {
		return ColorInfo.desaturate(this, amount);
	}

	/**
	 * 
	 * @param {ColorInfo} color 
	 * @returns Color 
	 */
	static grayscale(color) {
		return ColorInfo.desaturate(color, 100);
	}

	/**
	 * 
	 * @returns Color 
	 */
	grayscale() {
		return ColorInfo.greyscale(this);
	}

	/**
	 * 
	 * @param {ColorInfo} color 
	 * @returns Color 
	 */
	static greyscale(color) {
		return ColorInfo.desaturate(color, 100);
	}

	/**
	 * 
	 * @returns Color 
	 */
	greyscale() {
		return ColorInfo.greyscale(this);
	}

	/**
	 * 
	 * @param {ColorInfo} color 
	 * @param {Number} amount
	 * @returns Color 
	 */
	static lighten(color, amount) {
		this.ic(color, ColorInfo)
		this.tc(amount, "number")

		const hsl = color.toHsl();
		let h = hsl.h;
		let s = hsl.s;
		let l = this.clmp(hsl.l + amount, 100, 0);

		return ColorInfo.fromHsl(h, s, l);
	}
	/** @param {Number} amount */
	lighten(amount) { return ColorInfo.lighten(this, amount) }

	/**
	 * 
	 * @param {ColorInfo} color 
	 * @param {Number} amount
	 * @returns Color 
	 */
	static darken(color, amount) {
		return ColorInfo.lighten(color, -amount);
	}
	/** @param { Number } amount */
	darken(amount) { return ColorInfo.darken(this, amount) }


	/**
	 * 
	 * @param {ColorInfo} color 
	 * @param {Number} amount 
	 * @returns Color 
	 */
	static brighten(color, amount) {
		let rgb = color.toRgb();

		rgb.r = Math.max(0, Math.min(255, rgb.r - Math.round(255 * - (amount / 100))));
		rgb.g = Math.max(0, Math.min(255, rgb.g - Math.round(255 * - (amount / 100))));
		rgb.b = Math.max(0, Math.min(255, rgb.b - Math.round(255 * - (amount / 100))));

		return new ColorInfo(rgb.r, rgb.g, rgb.b);
	}

	/**
	 * 
	 * @param {Number} amount 
	 * @returns Color
	 */
	brighten(amount) {
		return ColorInfo.brighten(this, amount);
	}



	/** @param {ColorInfo} color @param {Number} angle  */
	static shiftHue(color, angle) {
		this.ic(color, ColorInfo);
		this.tc(angle, Number)
		let { h, s, l } = color.toHsl();
		h = this.shift(h, angle)
		return ColorInfo.fromHsl(h, s, l);
	}
	/** @param {Number} angle */
	shiftHue(angle) { return ColorInfo.shiftHue(this, angle) }



	/** @param {ColorInfo} color1 @param {ColorInfo} color2  */
	static multiply(color1, color2) {
		this.ic(color1, ColorInfo);
		this.ic(color2, ColorInfo);
		let { r1, g1, b1 } = color1.toRgb();
		let { r2, g2, b2 } = color2.toRgb();

		return ColorInfo.fromRgb((r1 * r2) / 255, (g1 * g2) / 255, (b1 * b2) / 255);
	}
	/** @param {Number} angle */
	multiply(color) { return ColorInfo.multiply(this, color) }


	/** @param {ColorInfo} color1 @param {ColorInfo} color2 @param {Number} amount */
	static mix(color1, color2, amount = 50) {
		this.ic(color1, ColorInfo);
		this.ic(color1, ColorInfo);
		this.tc(amount, "number")

		const rgb1 = color1.toRgb();
		const rgb2 = color2.toRgb();

		const p = this.clmp(amount, 100, 0) / 100;

		const r = Math.round(((rgb2.r - rgb1.r) * p) + rgb1.r);
		const g = Math.round(((rgb2.g - rgb1.g) * p) + rgb1.g);
		const b = Math.round(((rgb2.b - rgb1.b) * p) + rgb1.b);

		return ColorInfo.fromRgb(r, g, b);
	}


	/** @param {ColorInfo} color1 @param {ColorInfo} color2 @param {Number} amount */
	mix(color, amount) {
		return ColorInfo.mix(this, color, amount);
	}

	/** @param {ColorInfo} color1 @param {ColorInfo} color2 @param {Number} amount */
	static lerp(color1, color2, t = 0.5) {
		this.tc(t, "number");
		this.ic(color1, ColorInfo);
		this.ic(color2, ColorInfo);
		t = this.clmp(t, 1, 0);
		let rgb1 = color1.toRgb();
		let rgb2 = color2.toRgb();

		let r1 = rgb1.r / 255;
		let g1 = rgb1.g / 255;
		let b1 = rgb1.b / 255;

		let r2 = rgb2.r / 255;
		let g2 = rgb2.g / 255;
		let b2 = rgb2.b / 255;

		return ColorInfo.fromRgb(
			(r1 + (r2 - r1) * t) * 255,
			(g1 + (g2 - g1) * t) * 255,
			(b1 + (b2 - b1) * t) * 255
		);
	}

	/** @param {ColorInfo} color @param {Number} amount */
	lerp(color, t) {
		return ColorInfo.lerp(this, color, t);
	}


	/**@param {ColorInfo} color1 @param {ColorInfo} color2 */
	static add(color1, color2) {
		this.ic(color1, ColorInfo);
		this.ic(color2, ColorInfo);

		let rgb1 = color1.toRgb();
		let rgb2 = color2.toRgb();

		let r1 = rgb1.r;
		let g1 = rgb1.g;
		let b1 = rgb1.b;

		let r2 = rgb2.r;
		let g2 = rgb2.g;
		let b2 = rgb2.b;

		return ColorInfo.fromRgb(
			Math.round((r1 + r2) / 2),
			Math.round((g1 + g2) / 2),
			Math.round((b1 + b2) / 2),
		)

	}

	/** @param {ColorInfo} color */
	add(color) {
		return ColorInfo.add(this, color);
	}
	//#endregion


	//#region from methods

	/**
	 * 
	 * @param {string} hex
	 * @returns Color
	 */
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

	/**
	 * 
	 * @param {Number} r 
	 * @param {Number} g 
	 * @param {Number} b 
	 * @returns Color
	 */
	static fromRgb(r, g, b) {
		return new ColorInfo(r, g, b)
	}

	/**
	 * 
	 * @param {Number} hue 
	 * @param {Number} sat 
	 * @param {Number} lum 
	 * @returns Color
	 */
	static fromHsl(hue, sat, lum) {
		hue = this.tc(hue, "number")
		sat = this.tc(sat, "number")
		lum = this.tc(lum, "number")
		if (!(0 <= hue && hue <= 360)) throw new Error('HSL color values out of range, hue (0 - 360)')
		if (!(0 <= sat && sat <= 100)) throw new Error('HSL color values out of range, sat (0 - 100)')
		if (!(0 <= lum && lum <= 100)) throw new Error('HSL color values out of range, lum (0 - 100)')

		sat /= 100;
		lum /= 100;

		let c = (1 - Math.abs(2 * lum - 1)) * sat;
		let x = c * (1 - Math.abs((hue / 60) % 2 - 1));
		let m = lum - c / 2;
		let r = 0;
		let g = 0;
		let b = 0;

		if (0 <= hue && hue < 60) {
			r = c; g = x; b = 0;
		} else if (60 <= hue && hue < 120) {
			r = x; g = c; b = 0;
		} else if (120 <= hue && hue < 180) {
			r = 0; g = c; b = x;
		} else if (180 <= hue && hue < 240) {
			r = 0; g = x; b = c;
		} else if (240 <= hue && hue < 300) {
			r = x; g = 0; b = c;
		} else if (300 <= hue && hue <= 360) {
			r = c; g = 0; b = x;
		}

		const red = Math.round((r + m) * 255);
		const green = Math.round((g + m) * 255);
		const blue = Math.round((b + m) * 255);

		const color = new ColorInfo(red, green, blue);

		return color;
	}

	/**
	 * 
	 * @param {Number} hue 
	 * @param {Number} sat 
	 * @param {Number} lum 
	 * @returns Color
	 */
	static fromHsv(hue, sat, val) {
		hue = this.tc(hue, "number")
		sat = this.tc(sat, "number")
		val = this.tc(val, "number")
		if (!(0 <= hue && hue <= 360)) throw new Error('HSL color values out of range, hue (0 - 360)')
		if (!(0 <= sat && sat <= 100)) throw new Error('HSL color values out of range, sat (0 - 100)')
		if (!(0 <= val && val <= 100)) throw new Error('HSL color values out of range, lum (0 - 100)')

		sat /= 100;
		val /= 100;
		let c = val * sat;
		let x = c * (1 - Math.abs((hue / 60) % 2 - 1));
		let m = val - c;

		let r = 0;
		let g = 0;
		let b = 0;

		if (0 <= hue && hue < 60) {
			r = c;
			g = x;
			b = 0;
		}

		else if (60 <= hue && hue < 120) {
			r = x;
			g = c;
			b = 0;
		}

		else if (120 <= hue && hue < 180) {
			r = 0;
			g = c;
			b = x;
		}

		else if (180 <= hue && hue < 240) {
			r = 0;
			g = x;
			b = c;
		}

		else if (240 <= hue && hue < 300) {
			r = x;
			g = 0;
			b = c;
		}

		else if (300 <= hue && hue <= 360) {
			r = c;
			g = 0;
			b = x;
		}

		const red = ((r + m) * 255);
		const green = ((g + m) * 255);
		const blue = ((b + m) * 255);

		const color = new ColorInfo(red, green, blue);

		return color;

	}

	/**
	 * 
	 * @param {string} colorString 
	 * @returns Color 
	 */
	static fromCssString(colorString) {
		this.tc(colorString, "string")
		var ctx = document.createElement("canvas").getContext("2d");
		let value;
		if (ctx) {
			ctx.fillStyle = colorString;
			value = ctx.fillStyle;
		}
		if (!value) throw new Error("Invalid Color string");
		return ColorInfo.fromHex(value);
	}

	/**
	 * 
	 * @param {string} colorName 
	 * @returns {ThisType} 
	 */
	static fromName(colorName): ColorInfo {
		colorName = this.tc(colorName, "string")
		const color = this.Colors[colorName.toUpperCase()];
		if (!color) throw new Error('Invalid Color name');
		return color;
	}

	//#endregion

	//#region to methods

	/**
	 * @typedef {Object} hsl
	 * @property {Number} h - hue
	 * @property {Number} s - saturation
	 * @property {Number} l - luminance
	 */
	/**
	 * @param {ColorInfo} color 
	 * @returns string
	 */
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

	/**
	 * 
	 * @param {ColorInfo} color
	 * @returns Number[] 
	 */
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



	/**
	 * @typedef {Object} hsv
	 * @property {Number} h - hue
	 * @property {Number} s - saturation
	 * @property {Number} v - value
	 */
	/**
	 * @param {ColorInfo} color 
	 * @returns { hsv }
	 */
	static toHsv(color) {
		let h = 0;
		let s = 0;
		let v = 0;

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

		if (cmax !== 0) {
			s = (delta / cmax) * 100;
		}

		v = cmax * 100;
		return { h: this.nc(h), s: this.nc(s), v: this.nc(v) };

	}


	/**
	 * @typedef {Object} rgb
	 * @property {Number} r - red
	 * @property {Number} g - green
	 * @property {Number} b - blue
	*/
	/**
	 * 
	 * @param {ColorInfo} color 
	 * @returns { rgb }
	 */
	static toRgb(color) {
		this.ic(color, ColorInfo);
		return { r: color.#red, g: color.#green, b: color.#blue };
	}

	/**
	 * @typedef {Object} cmyk
	 * @property {Number} c - cyan
	 * @property {Number} m - magenta
	 * @property {Number} y - yellow
	 * @property {Number} k - black
	*/
	/**
	 * 
	 * @param {ColorInfo} color 
	 * @returns { cmyk }
	 */
	static toCmyk(color) {
		this.ic(color, ColorInfo);
		let { r, g, b } = color.toRgb();
		let c = 1 - (r / 255);
		let m = 1 - (g / 255);
		let y = 1 - (b / 255);
		let k = Math.min(c, Math.min(m, y));

		c = (c - k) / (1 - k);
		m = (m - k) / (1 - k);
		y = (y - k) / (1 - k);

		c = this.nc(Math.round(c * 10000) / 100);
		m = this.nc(Math.round(m * 10000) / 100);
		y = this.nc(Math.round(y * 10000) / 100);
		k = this.nc(Math.round(k * 10000) / 100);

		return { c, m, y, k };
	}

	//#endregion

	//#region to methods (instance)

	/**
	 * @typedef {Object} hsl
	 * @property {Number} h - hue
	 * @property {Number} s - saturation
	 * @property {Number} l - luminance
	 */
	/** @returns { hsl } */
	toHsl() {
		return ColorInfo.toHsl(this);
	}

	/**
	 * @typedef {Object} hsv
	 * @property {Number} h - hue
	 * @property {Number} s - saturation
	 * @property {Number} v - value
	 */
	/** @returns { hsv } */
	toHsv() {
		return ColorInfo.toHsv(this);
	}

	/** @returns string */
	toHex() {
		return ColorInfo.toHex(this);
	}

	/**
	 * @returns {rgb}
	 */
	toRgb() {
		return ColorInfo.toRgb(this);
	}

	/**
	 * @returns {cmyk}
	 */
	toCmyk() {
		return ColorInfo.toCmyk(this);
	}



	//#endregion

	static random() {
		const r = Math.floor(Math.random() * 255)
		const g = Math.floor(Math.random() * 255)
		const b = Math.floor(Math.random() * 255)
		return new ColorInfo(r, g, b)
	}

	toString(type = "hex"): string {
		ColorInfo.tc(type, "string");
		const rgb = this.toRgb();
		const hsl = this.toHsl();
		switch (type.toLowerCase()) {
			case "hex":
				return this.toHex();

			case "hexa":
				let a = Math.round(this.alpha * 255).toString(16);
				if (a.length === 1) { a = "0" + a; };
				return this.toHex() + a;

			case "rgb":
				return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;


			case "rgba":
				return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${this.alpha})`;

			case "hsl":
				return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;


			case "hsla":
				return `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%, ${this.alpha})`;

			case "hsv":
				const hsv = this.toHsv();
				return `hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%)`;

			case "cmyk":
				const cmyk = this.toCmyk();
				return `cmyk(${Math.round(cmyk.c)}%, ${Math.round(cmyk.m)}%, ${Math.round(cmyk.y)}%, ${Math.round(cmyk.k)}%)`;

			default:
				"Can't convert Color to given string type";

		}
		return "";
	}

	valueOf() {
		return parseInt("0x" + this.toHex().slice(1));
	}

}