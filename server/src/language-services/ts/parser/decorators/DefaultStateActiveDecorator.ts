import { DecoratorInfo } from '../DecoratorInfo';


export class DefaultStateActiveDecorator {
	public managerName: string = "";
	public static is(decorator: DecoratorInfo): DefaultStateActiveDecorator | null {
		if (decorator.name == "DefaultStateActive") {
			let result = new DefaultStateActiveDecorator();
			if (decorator.arguments.length > 0) {
				try {
					let parsed = DefaultStateParser.parse(decorator);
					result.managerName = parsed.managerName;
				} catch (e) {

				}
			}
			return result;
		}
		return null;
	}
}

export class DefaultStateParser {
	public static parse(decorator: DecoratorInfo) {
		let result: {
			managerName: string
		} = {
			managerName: "",
		}
		try {
			let managerName = decorator.arguments[0].value;
			const remplacement = decorator.baseInfo?.dependancesLocations[managerName]?.replacement;
			if (remplacement) {
				managerName = remplacement;
			}
			result.managerName = managerName;
		} catch (e) { }
		return result;
	}
}