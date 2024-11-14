import { Action, ActionOption, ArgOption } from './Action';

export class Build extends Action {
	public get name(): string {
		return "build";
	}
	public get description(): string {
		return "Build an aventus project"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {
		addArg({
			description: "aventus.conf.avt path",
			type: "string",
			typeIsRequired:false
		})
	}
	protected registerOptions(addOption: (option: ActionOption) => void) {
		addOption({
			name: "build",
			description: "Define the build name",
			type: "string",
			typeIsRequired: true,
			typeIsArray: true,
		});
		addOption({
			name: "static",
			description: "Define the static files to export",
			type: "string",
			typeIsRequired: true,
			typeIsArray: true,
		})
	}
	public run(args: string[], options: { [key: string]: string; }) {

	}

}
