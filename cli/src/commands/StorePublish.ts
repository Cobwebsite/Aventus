import { Action, ActionOption, ArgOption } from './Action';
import { Server } from '../server/Server';
import { Interaction } from '../interaction/Interaction';

type StorePublishOptions = {}

export class StorePublish extends Action<StorePublishOptions> {
	public get name(): string {
		return "store publish";
	}
	public get description(): string {
		return "Publish to the store"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {

	}
	protected registerOptions(addOption: (option: ActionOption<StorePublishOptions>) => void) {
		
	}
	public async run(args: string[], options: StorePublishOptions) {
		try {
			await Interaction.load();
			await Server.load();

			await Server.start({
				noStart: true
			});
			await Server.executeCommand("aventus.store.publish_package");
		} catch (e) {
			console.log(e)
		}
	}

}