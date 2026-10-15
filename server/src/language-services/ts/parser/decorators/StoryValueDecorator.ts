import { DecoratorInfo } from '../DecoratorInfo';


export class StoryValueDecorator {
	public static is(decorator: DecoratorInfo): StoryValueDecorator | null {
		if (decorator.name == "StoryValue") {
			if (decorator.arguments.length > 0) {
				const argument = decorator.arguments[0];
				let content: string = argument.type === 'string' ? JSON.stringify(argument.value) : argument.value;
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
