import { DecoratorInfo } from '../DecoratorInfo';

type DependenciesConfig = {
	/** The type to load */
	type: any,
	/** The type must be loaded before the current class */
	strong: boolean;
}
export class DependenciesDecorator {
	public dependencies: DependenciesConfig[] = [];

	public static is(decorator: DecoratorInfo): DependenciesDecorator | null {
		if (decorator.name == "Dependencies") {
			let result = new DependenciesDecorator();
			if (decorator.arguments.length > 0) {
				try {
					let params = JSON.parse(decorator.arguments[0].value) as DependenciesConfig[];
					for (let dep of params) {
						let isStrong = dep.strong == true;
						result.dependencies.push({
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