import { DecoratorInfo } from '../DecoratorInfo';

type DependanceConfig = {
	/** The type to load */
	type: any,
	/** The type must be loaded before the current class */
	strong: boolean;
}
export class DependancesDecorator {
	public dependances: DependanceConfig[] = [];

	public static is(decorator: DecoratorInfo): DependancesDecorator | null {
		if (decorator.name == "Dependances") {
			let result = new DependancesDecorator();
			if (decorator.arguments.length > 0) {
				try {
					let params = JSON.parse(decorator.arguments[0].value) as DependanceConfig[];
					for (let dep of params) {
						let isStrong = dep.strong == true;
						result.dependances.push({
							type: dep.type,
							strong: isStrong
						})
					}
				} catch (e) {

				}
			}
			return result;
		}
		return null;
	}
}