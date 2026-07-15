import { resolve } from 'path';
import { Action, ActionOption, ArgOption } from '../Action';
import { Server } from '../../server/Server';

type PrepareOptions = {}

export class Prepare extends Action<PrepareOptions> {
	public get name(): string {
		return "ai prepare";
	}
	public get description(): string {
		return "Prepare file to help AI"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {

	}
	protected registerOptions(addOption: (option: ActionOption<PrepareOptions>) => void) {

	}
	public async run(args: string[], options: PrepareOptions) {
		try {
			let configPath = args[0];
			if (configPath) {
				configPath = resolve(configPath);
			}
			await Server.load();

			await Server.start({
				noBuild: true,
				loadFiles: false,
				configPath: configPath
			});
			await Server.executeCommand("aventus.ai.dependencies");
			await Server.executeCommand("aventus.ai.rules");

		} catch (e) {
			console.log(e)
		}
	}

}