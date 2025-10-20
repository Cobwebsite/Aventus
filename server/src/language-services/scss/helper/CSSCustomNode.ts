export declare interface SCSSDoc {
	[key: string]: CustomCssProperty[],
}
export type CustomCssPropertyType = '*' | 'color' | 'number' | 'length' | 'percentage' | 'length-percentage' | 'image' | 'url' | 'integer' | 'angle' | 'time' | 'resolution' | 'transform-function' | 'custom-ident' | 'transform-list' | 'literal';
export interface CustomCssProperty {
	name: string;
	documentation?: string,
	type?: CustomCssPropertyType,
	/** values if type is literal */
	typeValues?: string[],
	defaultValue?: string,
	chainValues?: string[],
}