import { DecoratorInfo } from '../DecoratorInfo';


export class StoryValueDecorator {
	public static is(decorator: DecoratorInfo): StoryValueDecorator | null {
		if (decorator.name == "StoryValue") {
			if (decorator.arguments.length > 0) {
				let content: string = decorator.arguments[0].value;
				return new StoryValueDecorator(content);
			}
			return null;
		}
		return null;
	}

	public value: string;
	public constructor(value: string) {
		this.value = value;
	}
}