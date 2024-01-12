import { DecoratorInfo } from '../DecoratorInfo';
import { StateParser } from './StateActiveDecorator';


export class StateInactiveDecorator {
	public stateName: string = "";
	public managerName: string = "";
	public functionName:string = "inactive";
	public static is(decorator: DecoratorInfo): StateInactiveDecorator | null {
		if (decorator.name == "StateInactive") {
			let result = new StateInactiveDecorator();
			if (decorator.arguments.length > 0) {
				try {
					let parsed = StateParser.parse(decorator);
					result.stateName = parsed.stateName;
					result.managerName = parsed.managerName ?? "";
				} catch (e) {

				}
			}
			return result;
		}
		return null;
	}
}