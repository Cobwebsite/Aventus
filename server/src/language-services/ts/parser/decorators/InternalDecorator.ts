import { DecoratorInfo } from '../DecoratorInfo';


export class InternalDecorator {
	

	public static is(decorator: DecoratorInfo): InternalDecorator | null {
		if (decorator.name == "Internal") {
			let result = new InternalDecorator();
			return result;
		}
		return null;
	}
}

export class InternalProtectedDecorator {
	

	public static is(decorator: DecoratorInfo): InternalProtectedDecorator | null {
		if (decorator.name == "InternalProtected") {
			let result = new InternalProtectedDecorator();
			return result;
		}
		return null;
	}
}