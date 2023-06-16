import { DecoratorInfo } from '../DecoratorInfo';


export class StateChangeDecorator {
	public stateName:string = "";
	public managerName:string = "";
	public functionName:string = "askChange";
	public static is(decorator: DecoratorInfo): StateChangeDecorator | null {
		if (decorator.name == "StateChange") {
			let result = new StateChangeDecorator();
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