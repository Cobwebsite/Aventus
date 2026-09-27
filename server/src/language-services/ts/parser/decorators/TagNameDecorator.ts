import { DecoratorInfo } from '../DecoratorInfo';


export class TagNameDecorator {
	public tagName: string | null = "";

	public static is(decorator: DecoratorInfo): TagNameDecorator | null {
		if (decorator.name == "TagName") {
			let result = new TagNameDecorator();
			if (decorator.arguments.length > 0) {
				const value = decorator.arguments[0].value;
				result.tagName = /^["'`]/.test(value) ? value.slice(1, -1) : value;
			}
			return result;
		}
		return null;
	}
}
