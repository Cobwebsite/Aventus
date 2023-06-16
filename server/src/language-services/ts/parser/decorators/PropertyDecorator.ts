import { DecoratorInfo } from '../DecoratorInfo';

export class PropertyDecorator {
	public fctTxt: string | null = null;

	public static is(decorator: DecoratorInfo): PropertyDecorator | null {
		if (decorator.name == "Property") {
			let result = new PropertyDecorator();
			if (decorator.arguments.length > 0) {
				try {
					if (decorator.arguments[0].type == 'call') {
						result.fctTxt = decorator.arguments[0].value;
					}
				} catch (e) {

				}
			}
			return result;
		}
		return null;
	}
}