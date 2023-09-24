import { DecoratorInfo } from '../DecoratorInfo';

export class ConvertibleDecorator {
	public name: string = "Fullname";

	public static is(decorator: DecoratorInfo): ConvertibleDecorator | null {
		if (decorator.name == "Convertible") {
			let result = new ConvertibleDecorator();
			if (decorator.arguments.length > 0) {
				try {
					result.name = decorator.arguments[0].value
				} catch (e) {

				}
			}
			return result;
		}
		return null;
	}
}