import { DecoratorInfo } from '../DecoratorInfo';


export class StateInactiveDecorator {
	public stateName: string = "";
	public managerName: string = "";
	public functionName:string = "inactive";
	public static is(decorator: DecoratorInfo): StateInactiveDecorator | null {
		if (decorator.name == "StateInactive") {
			let result = new StateInactiveDecorator();
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