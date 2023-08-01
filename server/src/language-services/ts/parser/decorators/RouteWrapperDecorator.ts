import { DecoratorInfo } from '../DecoratorInfo';


export class RouteWrapperDecorator {

	public static is(decorator: DecoratorInfo): RouteWrapperDecorator | null {
		if (decorator.name == "RouteWrapper") {
			let result = new RouteWrapperDecorator();
			return result;
		}
		return null;
	}
}