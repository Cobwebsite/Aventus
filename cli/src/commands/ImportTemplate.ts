import { Action, ActionOption, ArgOption } from './Action';
import { Server } from '../server/Server';
import { Interaction } from '../interaction/Interaction';
import { pathToUri } from '../tools';

type ImportTemplateOptions = {}

export class ImportTemplate extends Action<ImportTemplateOptions> {
	public get name(): string {
		return "template install";
	}
	public get description(): string {
		return "Import template to create aventus element"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {

	}
	protected registerOptions(addOption: (option: ActionOption<ImportTemplateOptions>) => void) {

	}
	public async run(args: string[], options: ImportTemplateOptions) {
		try {
			await Interaction.load();
			await Server.load();

			await Server.start({
				noBuild: true,
				useTemplates: true
			});
			await Server.executeCommand("aventus.template.import");
		} catch (e) {
			console.log(e)
		}
	}

}