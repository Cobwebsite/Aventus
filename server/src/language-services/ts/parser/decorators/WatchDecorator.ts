import { DecoratorInfo } from '../DecoratorInfo';

export class WatchDecorator {
	public fctTxt: string | null = null;

	public static is(decorator: DecoratorInfo): WatchDecorator | null {
		if (decorator.name == "Watch") {
			let result = new WatchDecorator();
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