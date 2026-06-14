import { resolve } from 'path';
import { Action, ActionOption, ArgOption } from '../Action';
import { Server } from '../../server/Server';

type HelpLLMOptions = {}

export class HelpLLM extends Action<HelpLLMOptions> {
	public get name(): string {
		return "dependencies help-llm";
	}
	public get description(): string {
		return "Write dependencies to help llm"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {

	}
	protected registerOptions(addOption: (option: ActionOption<HelpLLMOptions>) => void) {

	}
	public async run(args: string[], options: HelpLLMOptions) {
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

		} catch (e) {
			console.log(e)
		}
	}

}