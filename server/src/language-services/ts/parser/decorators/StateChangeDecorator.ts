import { DecoratorInfo } from '../DecoratorInfo';
import { StateParser } from './StateActiveDecorator';


export class StateChangeDecorator {
	public stateName:string = "";
	public managerName:string = "";
	public functionName:string = "askChange";
	public static is(decorator: DecoratorInfo): StateChangeDecorator | null {
		if (decorator.name == "StateChange") {
			let result = new StateChangeDecorator();
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