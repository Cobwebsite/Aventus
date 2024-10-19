import { DecoratorInfo } from '../DecoratorInfo';

export class SignalDecorator {
	public fctTxt: string | null = null;

	public static is(decorator: DecoratorInfo): SignalDecorator | null {
		if (decorator.name == "Signal") {
			let result = new SignalDecorator();
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