import { DecoratorInfo } from '../DecoratorInfo';

export class ForeignKeyDecorator {
	public refType: string = "";

	public constructor(refType: string) {
		this.refType = refType;
	}
	public static is(decorator: DecoratorInfo): ForeignKeyDecorator | null {
		if (decorator.name == "ForeignKey") {
			if (decorator.arguments.length > 0) {
				try {
					if (decorator.arguments[0].type == "identifier") {
						let result = new ForeignKeyDecorator(decorator.arguments[0].value);
						return result;
					}
				} catch (e) {

				}
			}
		}
		return null;
	}
}