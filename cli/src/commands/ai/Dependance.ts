import { resolve } from 'path';
import { Action, ActionOption, ArgOption } from '../Action';
import { Server } from '../../server/Server';

type DependanceOptions = {}

export class Dependance extends Action<DependanceOptions> {
	public get name(): string {
		return "dependances help-llm";
	}
	public get description(): string {
		return "Write dependances to help llm"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {

	}
	protected registerOptions(addOption: (option: ActionOption<DependanceOptions>) => void) {

	}
	public async run(args: string[], options: DependanceOptions) {
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
			await Server.executeCommand("aventus.ai.dependances");

		} catch (e) {
			console.log(e)
		}
	}

}