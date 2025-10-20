import { DecoratorInfo } from '../DecoratorInfo';


export class DeprecatedDecorator {
	public msg: string = "This code is deprecated";

	public static is(decorator: DecoratorInfo): DeprecatedDecorator | null {
		if (decorator.name == "Deprecated") {
			let result = new DeprecatedDecorator();
			if (decorator.arguments.length > 0) {
				try {
					result.msg = decorator.arguments[0].value
				} catch (e) {

				}
			}
			return result;
		}
		return null;
	}
}