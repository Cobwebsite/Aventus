import { DecoratorInfo } from '../DecoratorInfo';

type OverrideViewConfig = {
	/** if set the component ll do a query selector else the component is the one loaded on first render */
	removeViewVariables?: string[]
}
export class OverrideViewDecorator {
	public removeViewVariables: string[] = [];

	public static is(decorator: DecoratorInfo): OverrideViewDecorator | null {
		if (decorator.name == "OverrideView") {
			let result = new OverrideViewDecorator();
			if (decorator.arguments.length > 0) {
				try {
					let params = JSON.parse(decorator.arguments[0].value) as OverrideViewConfig;
					if(params.removeViewVariables){
						result.removeViewVariables = params.removeViewVariables;
					}
				} catch (e) {

				}
			}
			return result;
		}
		return null;
	}
}