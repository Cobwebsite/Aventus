import { DecoratorInfo } from '../DecoratorInfo';


export class BindThisDecorator {
	

	public static is(decorator: DecoratorInfo): BindThisDecorator | null {
		if (decorator.name == "BindThis") {
			let result = new BindThisDecorator();
			return result;
		}
		return null;
	}
}