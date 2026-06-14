import { Action, ActionOption, ArgOption } from '../Action';
import { Server } from '../../server/Server';
import { Interaction } from '../../interaction/Interaction';

type UninstallProjectOptions = {}

export class UninstallProject extends Action<UninstallProjectOptions> {
	public get name(): string {
		return "project uninstall";
	}
	public get description(): string {
		return "Uninstall project"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {

	}
	protected registerOptions(addOption: (option: ActionOption<UninstallProjectOptions>) => void) {

	}
	public async run(args: string[], options: UninstallProjectOptions) {
		try {
			await Interaction.load();
			await Server.load();

			await Server.start({
				noBuild: true,
				useTemplates: true
			});
			await Server.executeCommand("aventus.template.uninstall_project");
		} catch (e) {
			console.log(e)
		}
	}

}