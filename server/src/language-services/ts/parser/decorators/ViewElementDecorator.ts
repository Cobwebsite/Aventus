import { DecoratorInfo } from '../DecoratorInfo';

type ViewElementConfig = {
	/** if set the component ll do a query selector else the component is the one loaded on first render */
	useLive?: boolean
}
export class ViewElementDecorator {
	public useLive?: boolean = undefined;

	public static is(decorator: DecoratorInfo): ViewElementDecorator | null {
		if (decorator.name == "ViewElement") {
			let result = new ViewElementDecorator();
			if (decorator.arguments.length > 0) {
				try {
					let params = JSON.parse(decorator.arguments[0].value) as ViewElementConfig;
					if(params.useLive === true) {
						result.useLive = true;
					}
					else if(params.useLive === false) {
						result.useLive = false;
					}
				} catch (e) {

				}
			}
			return result;
		}
		return null;
	}
}