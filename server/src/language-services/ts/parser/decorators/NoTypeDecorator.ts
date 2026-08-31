import { DecoratorInfo } from '../DecoratorInfo';


export class NoTypeDecorator {
	
	public static is(decorator: DecoratorInfo): NoTypeDecorator | null {
		if (decorator.name == "NoType") {
			let result = new NoTypeDecorator();
			return result;
		}
		return null;
	}
}