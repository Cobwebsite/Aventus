import { DecoratorInfo } from '../DecoratorInfo';

export type EffectDecoratorOption = {
	autoInit?: boolean
}

export class EffectDecorator {
	public options: EffectDecoratorOption = {
		autoInit: true
	};

	public static is(decorator: DecoratorInfo): EffectDecorator | null {
		if (decorator.name == "Effect") {
			let result = new EffectDecorator();
			if (decorator.arguments.length > 0) {
				try {
					let params = JSON.parse(decorator.arguments[0].value) as EffectDecoratorOption;
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