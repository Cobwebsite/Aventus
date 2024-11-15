import { resolve } from 'path';
import { Server } from '../server/Server';
import { Action, ActionOption, ArgOption } from './Action';

type BuildOptions = {
	builds?: string[],
	statics?: string[],
	verbose?: boolean,
}

export class Build extends Action<BuildOptions> {
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
			typeIsRequired: false
		})
	}
	protected registerOptions(addOption: (option: ActionOption<BuildOptions>) => void) {
		addOption({
			name: "builds",
			description: "Define the build name",
			type: "string",
			typeIsRequired: true,
			typeIsArray: true,
		});
		addOption({
			name: "statics",
			description: "Define the static files to export",
			type: "string",
			typeIsRequired: true,
			typeIsArray: true,
		})
		addOption({
			name: "verbose",
			shortName: "v",
			description: "Debug your compilation",
		})
	}
	public async run(args: string[], options: BuildOptions) {
		let configPath = args[0];
		if (configPath) {
			configPath = resolve(configPath);
		}
		await Server.load();
		await Server.start({
			onlyBuild: true,
			configPath: configPath,
			builds: options.builds,
			statics: options.statics,
			debug: options.verbose
		});

		const errors = Server.getErrors();
		for (let error of errors) {
			console.log(error);
		}
		if (errors.length == 0) {
			console.log("Build success");
		}
	}

}
