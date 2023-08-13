import { DecoratorInfo } from '../DecoratorInfo';

type DebuggerConfig = {
	/** Write the compiled file inside ./compiled.js */
	writeCompiled?: boolean,
	/** Enable history for watch property and add a function getWatchHistory on this component*/
	enableWatchHistory?: boolean,
}
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