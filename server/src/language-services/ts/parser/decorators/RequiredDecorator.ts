import { DecoratorInfo } from '../DecoratorInfo';


export class RequiredDecorator {

	public static is(decorator: DecoratorInfo): RequiredDecorator | null {
		if (decorator.name == "Required") {
			let result = new RequiredDecorator();
			return result;
		}
		return null;
	}
}