import { Action, ActionOption, ArgOption } from './Action';
import { Server } from '../server/Server';
import { resolve } from 'path';
import { LogLevel } from '@server/settings/Settings';

type FromatOptions = {
}

export class Format extends Action<FromatOptions> {
	public get name(): string {
		return "format";
	}
	public get description(): string {
		return "format your project"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {
		addArg({
			description: "aventus.conf.avt path",
			type: "string",
			typeIsRequired: false
		})
	}
	protected registerOptions(addOption: (option: ActionOption<FromatOptions>) => void) {
		// addOption({
		// 	name: "fix",
		// 	description: "Fix the ",
		// 	type: "string",
		// 	typeIsRequired: true,
		// 	typeIsArray: true,
		// });
	}
	public async run(args: string[], options: FromatOptions) {
		let configPath = args[0];
		if (configPath) {
			configPath = resolve(configPath);
		}
		await Server.load();
		await Server.start({
			noBuild: true,
			configPath: configPath,
		});

		await Server.executeCommand("aventus.format");

	}

}