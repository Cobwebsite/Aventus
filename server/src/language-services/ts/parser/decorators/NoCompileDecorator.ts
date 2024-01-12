import { DecoratorInfo } from '../DecoratorInfo';


export class NoCompileDecorator {
	

	public static is(decorator: DecoratorInfo): NoCompileDecorator | null {
		if (decorator.name == "NoCompile") {
			let result = new NoCompileDecorator();
			return result;
		}
		return null;
	}
}