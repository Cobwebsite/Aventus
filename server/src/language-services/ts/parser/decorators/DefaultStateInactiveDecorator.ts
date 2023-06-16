import { DecoratorInfo } from '../DecoratorInfo';


export class DefaultStateInactiveDecorator {
	public managerName: string = "";
	public static is(decorator: DecoratorInfo): DefaultStateInactiveDecorator | null {
		if (decorator.name == "DefaultStateInactive") {
			let result = new DefaultStateInactiveDecorator();
			if (decorator.arguments.length > 0) {
				try {
					result.managerName = decorator.arguments[0].value;
				} catch (e) {

				}
			}
			return result;
		}
		return null;
	}
}