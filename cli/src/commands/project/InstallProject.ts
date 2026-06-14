import { Action, ActionOption, ArgOption } from '../Action';
import { Server } from '../../server/Server';
import { Interaction } from '../../interaction/Interaction';
import { pathToUri } from '../../tools';

type InstallProjectOptions = {}

export class InstallProject extends Action<InstallProjectOptions> {
	public get name(): string {
		return "project install";
	}
	public get description(): string {
		return "Import project to init aventus"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {

	}
	protected registerOptions(addOption: (option: ActionOption<InstallProjectOptions>) => void) {

	}
	public async run(args: string[], options: InstallProjectOptions) {
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