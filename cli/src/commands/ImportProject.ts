import { Action, ActionOption, ArgOption } from './Action';
import { Server } from '../server/Server';
import { Interaction } from '../interaction/Interaction';
import { pathToUri } from '../tools';

type ImportProjectOptions = {}

export class ImportProject extends Action<ImportProjectOptions> {
	public get name(): string {
		return "project install";
	}
	public get description(): string {
		return "Import project to init aventus"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {

	}
	protected registerOptions(addOption: (option: ActionOption<ImportProjectOptions>) => void) {

	}
	public async run(args: string[], options: ImportProjectOptions) {
		try {
			await Interaction.load();
			await Server.load();

			await Server.start({
				noBuild: true,
				useTemplates: true
			});
			await Server.executeCommand("aventus.template.import_project");
		} catch (e) {
			console.log(e)
		}
	}

}