import { DecoratorInfo } from '../DecoratorInfo';


export class StateActiveDecorator {
	public stateName:string = "";
	public managerName:string = "";
	public functionName:string = "active";
	public static is(decorator: DecoratorInfo): StateActiveDecorator | null {
		if (decorator.name == "StateActive") {
			let result = new StateActiveDecorator();
			if (decorator.arguments.length > 0) {
				try {
					result.stateName = decorator.arguments[0].value;
					if (decorator.arguments.length > 1) {
						result.managerName = decorator.arguments[1].value;
					}
				} catch (e) {

				}
			}
			return result;
		}
		return null;
	}
}