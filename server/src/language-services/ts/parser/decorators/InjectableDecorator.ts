import { DecoratorInfo } from '../DecoratorInfo';


export class InjectableDecorator {
	
	public static is(decorator: DecoratorInfo): InjectableDecorator | null {
		if (decorator.name == "Injectable") {
			let result = new InjectableDecorator();
			return result;
		}
		return null;
	}
}