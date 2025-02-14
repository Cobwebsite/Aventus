import { DecoratorInfo } from '../DecoratorInfo';

export class AttributeDecorator {
	public fctTxt: string | null = null;

	public static is(decorator: DecoratorInfo): AttributeDecorator | null {
		if (decorator.name == "Attribute") {
			let result = new AttributeDecorator();
			return result;
		}
		return null;
	}
}