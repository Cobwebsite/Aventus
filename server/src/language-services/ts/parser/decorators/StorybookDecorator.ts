import { DecoratorInfo } from '../DecoratorInfo';

type StorybookConfig = {
	export?: boolean,
	prefix?: string,
	onlyMeta?: boolean;
}
export class StorybookDecorator {
	public prefix?: string;
	public cancelExport?: boolean;
	public onlyMeta?: boolean;
	public static is(decorator: DecoratorInfo): StorybookDecorator | null {
		if (decorator.name == "Storybook") {
			let result = new StorybookDecorator();
			if (decorator.arguments.length > 0) {
				try {
					let params = JSON.parse(decorator.arguments[0].value) as StorybookConfig;
					if (params.prefix) {
						result.prefix = JSON.parse(params.prefix);
					}
					if (params.export === false) {
						result.cancelExport = true;
					}
					if (params.onlyMeta === true) {
						result.onlyMeta = true;
					}
				} catch (e) {

				}
			}
			return result;
		}
		return null;
	}
}