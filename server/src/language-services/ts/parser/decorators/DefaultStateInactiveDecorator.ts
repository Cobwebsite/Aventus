import { DecoratorInfo } from '../DecoratorInfo';
import { DefaultStateParser } from './DefaultStateActiveDecorator';


export class DefaultStateInactiveDecorator {
	public managerName: string = "";
	public static is(decorator: DecoratorInfo): DefaultStateInactiveDecorator | null {
		if (decorator.name == "DefaultStateInactive") {
			let result = new DefaultStateInactiveDecorator();
			if (decorator.arguments.length > 0) {
				try {
					let parsed = DefaultStateParser.parse(decorator);
					result.managerName = parsed.managerName;
				} catch (e) {

				}
			}
			return result;
		}
		return null;
	}
}