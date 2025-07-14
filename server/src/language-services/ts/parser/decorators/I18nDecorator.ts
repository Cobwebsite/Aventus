import { DecoratorInfo } from '../DecoratorInfo';

export type I18nDecoratorOption = {
	autoInit?: boolean
}

export class I18nDecorator {
	public options: I18nDecoratorOption = {
		autoInit: true
	};

	public static is(decorator: DecoratorInfo): I18nDecorator | null {
		if (decorator.name == "I18n") {
			let result = new I18nDecorator();
			if (decorator.arguments.length > 0) {
				try {
					let params = JSON.parse(decorator.arguments[0].value) as I18nDecoratorOption;
					if (params.autoInit !== undefined) {
						result.options.autoInit = params.autoInit;
					}
				} catch (e) {

				}
			}
			return result;
		}
		return null;
	}
}