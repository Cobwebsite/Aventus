import { Action, ActionOption, ArgOption } from './Action';
import { Server } from '../server/Server';
import { Interaction } from '../interaction/Interaction';

type UninstallTemplateOptions = {}

export class UninstallTemplate extends Action<UninstallTemplateOptions> {
	public get name(): string {
		return "template uninstall";
	}
	public get description(): string {
		return "Uninstall project"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {

	}
	protected registerOptions(addOption: (option: ActionOption<UninstallTemplateOptions>) => void) {

	}
	public async run(args: string[], options: UninstallTemplateOptions) {
		try {
			await Interaction.load();
			await Server.load();

			await Server.start({
				noBuild: true,
				useTemplates: true
			});
			await Server.executeCommand("aventus.template.uninstall");
		} catch (e) {
			console.log(e)
		}
	}

}