import { CustomTypeAttribute } from "../../ts/component/compiler/def"

export declare interface HTMLDoc {
	[tagName: string]: HTMLTagDoc
}
export interface HTMLTagDoc {
	class: string,
	name: string,
	description: string,
	attributes: {
		[key: string]: HTMLAttributeDoc
	}
}
export interface HTMLAttributeDoc {
	name: string,
	description: string,
	type?: CustomTypeAttribute,
	values: {
		name: string,
		description: string,
	}[]
}