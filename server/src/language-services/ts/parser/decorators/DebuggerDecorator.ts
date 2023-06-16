import { DecoratorInfo } from '../DecoratorInfo';

type DebuggerConfig = {
	/** Write the compiled file inside ./compiled.js */
	writeCompiled?: boolean,
	/** Enable history for watch property and add a function getWatchHistory on this component*/
	enableWatchHistory?: boolean,
}
export class DebuggerDecorator {
	public writeCompiled: boolean = false;
	public enableWatchHistory: boolean = false;

	public static is(decorator: DecoratorInfo): DebuggerDecorator | null {
		if (decorator.name == "Debugger") {
			let result = new DebuggerDecorator();
			if (decorator.arguments.length > 0) {
				try {
					let params = JSON.parse(decorator.arguments[0].value) as DebuggerConfig;
					result.writeCompiled = params.writeCompiled == true;
					result.enableWatchHistory = params.enableWatchHistory == true;
				} catch (e) {

				}
			}
			return result;
		}
		return null;
	}
}