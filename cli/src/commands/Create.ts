import { Action, ActionOption, ArgOption } from './Action';
import { Server } from '../server/Server';
import { Interaction } from '../interaction/Interaction';
import { pathToUri } from '../tools';

type CreateOptions = {}

export class Create extends Action<CreateOptions> {
	public get name(): string {
		return "create";
	}
	public get description(): string {
		return "Create from a template"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {

	}
	protected registerOptions(addOption: (option: ActionOption<CreateOptions>) => void) {

	}
	public async run(args: string[], options: CreateOptions) {
		try {
			await Interaction.load();
			await Server.load();

			await Server.start({
				noBuild: true,
				useTemplates: true,
				loadFiles: true
			});
			await Server.executeCommand("aventus.create", pathToUri(process.cwd()));
		} catch (e) {
			console.log(e)
		}
	}

}