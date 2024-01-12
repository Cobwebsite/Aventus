import { DecoratorInfo } from '../DecoratorInfo';


export class StateActiveDecorator {
	public stateName: string = "";
	public managerName: string = "";
	public functionName: string = "active";
	public static is(decorator: DecoratorInfo): StateActiveDecorator | null {
		if (decorator.name == "StateActive") {
			let result = new StateActiveDecorator();
			if (decorator.arguments.length > 0) {
				try {
					let parsed = StateParser.parse(decorator);
					result.stateName = parsed.stateName;
					result.managerName = parsed.managerName ?? "";
				} catch (e) {

				}
			}
			return result;
		}
		return null;
	}
}

export class StateParser {
	public static parse(decorator: DecoratorInfo) {
		let result: {
			stateName: string,
			managerName?: string
		} = {
			stateName: "",
		}
		try {
			let stateName = decorator.arguments[0].value;
			if (decorator.arguments[0].type == "identifier") {
				let splitted = decorator.arguments[0].value.split(".");
				const remplacement = decorator.baseInfo.dependancesLocations[splitted[0]]?.replacement;
				if (remplacement) {
					splitted[0] = remplacement;
				}
				stateName = splitted.join(".");
			}
			result.stateName = stateName;

			if (decorator.arguments.length > 1) {
				let managerName = decorator.arguments[1].value;
				const remplacement = decorator.baseInfo.dependancesLocations[managerName]?.replacement;
				if (remplacement) {
					managerName = remplacement;
				}
				result.managerName = managerName;
			}
		} catch (e) { }
		return result;
	}
}