import { DecoratorInfo } from '../DecoratorInfo';

type StorybookConfig = {
	export?: StoryExport,
	prefix?: string,
	fullName?: string,
	onlyMeta?: boolean;
	slots?: {
		values?: {
			[name: string]: string;
		};
		inject?: string[];
	};
}
type StoryExport = 'all' | 'none' | 'public';
export class StorybookDecorator {
	public prefix?: string;
	public exportType?: StoryExport;
	public onlyMeta?: boolean;
	public fullName?: string
	public slots?: {
		values?: {
			[name: string]: string;
		};
		inject?: string[];
	};
	public static is(decorator: DecoratorInfo): StorybookDecorator | null {
		if (decorator.name == "Storybook") {
			let result = new StorybookDecorator();
			if (decorator.arguments.length > 0) {
				try {
					let params = JSON.parse(decorator.arguments[0].value) as StorybookConfig;
					if (params.prefix) {
						result.prefix = params.prefix.replace(/(^('|"))|(('|")$)/g, '');
					}
					if (params.export) {
						result.exportType = params.export.replace(/(^('|"))|(('|")$)/g, '') as StoryExport;
					}
					if (params.fullName) {
						result.fullName = params.fullName.replace(/(^('|"))|(('|")$)/g, '');
					}
					if (params.onlyMeta === true) {
						result.onlyMeta = true;
					}
					if (params.slots) {
						result.slots = {}

						if (params.slots.values) {
							result.slots.values = {};
							for (let key in params.slots.values) {
								result.slots.values[key.replace(/(^('|"))|(('|")$)/g, '')] = params.slots.values[key];
							}
						}
						if (params.slots.inject) {
							result.slots.inject = params.slots.inject
						}
					}
				} catch (e) {
					debugger
				}
			}
			return result;
		}
		return null;
	}
}