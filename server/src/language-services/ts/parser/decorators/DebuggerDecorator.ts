import { DecoratorInfo } from '../DecoratorInfo';

type DebuggerConfig = {
	/** Write the compiled file inside ./compiled.js */
	writeCompiled?: boolean,
	/** Write the view parsed */
	writeHTML?: boolean;
	/** Write the ts file for the component with template methods */
	writeComponentTs?: boolean;
	/** Enable history for watch property and add a function getWatchHistory on this component*/
	enableWatchHistory?: boolean,
}
export class DebuggerDecorator {
	public writeCompiled: boolean = false;
	public enableWatchHistory: boolean = false;
	public writeHTML: boolean = false;
	public writeComponentTs: boolean = false;

	public static is(decorator: DecoratorInfo): DebuggerDecorator | null {
		if (decorator.name == "Debugger") {
			let result = new DebuggerDecorator();
			if (decorator.arguments.length > 0) {
				try {
					let params = JSON.parse(decorator.arguments[0].value) as DebuggerConfig;
					result.writeCompiled = params.writeCompiled == true;
					result.enableWatchHistory = params.enableWatchHistory == true;
					result.writeHTML = params.writeHTML == true;
					result.writeComponentTs = params.writeComponentTs == true;
				} catch (e) {

				}
			}
			return result;
		}
		return null;
	}
}