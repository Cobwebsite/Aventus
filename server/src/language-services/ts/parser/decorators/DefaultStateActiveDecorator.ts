import { DecoratorInfo } from '../DecoratorInfo';


export class DefaultStateActiveDecorator {
	public managerName: string = "";
	public static is(decorator: DecoratorInfo): DefaultStateActiveDecorator | null {
		if (decorator.name == "DefaultStateActive") {
			let result = new DefaultStateActiveDecorator();
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