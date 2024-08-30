import { DecoratorInfo } from '../DecoratorInfo';


export class StoryValue {
	public static is(decorator: DecoratorInfo): StoryValue | null {
		if (decorator.name == "StoryValue") {
			if (decorator.arguments.length > 0) {
				let content: string = decorator.arguments[0].value;
				if (decorator.arguments[0].type == 'string') {
					content = content.replace(/(^('|"))|(('|")$)/g, '')
				}
				return new StoryValue(content);
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