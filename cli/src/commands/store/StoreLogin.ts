import { Action, ActionOption, ArgOption } from '../Action';
import { Server } from '../../server/Server';
import { Interaction } from '../../interaction/Interaction';

type StoreLoginOptions = {
	username?: string,
	password?: string
}

export class StoreLogin extends Action<StoreLoginOptions> {
	public get name(): string {
		return "store login";
	}
	public get description(): string {
		return "Login to the store"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {

	}
	protected registerOptions(addOption: (option: ActionOption<StoreLoginOptions>) => void) {
		addOption({
			name: "username",
			shortName: "u",
			description: "Username for connection",
			type: "string",
			typeIsRequired: true,
		});
		addOption({
			name: "password",
			shortName: "p",
			description: "Password for connection",
			type: "string",
			typeIsRequired: true,
		});
	}
	public async run(args: string[], options: StoreLoginOptions) {
		try {
			await Interaction.load();
			await Server.load();

			await Server.start({
				noStart: true
			});
			await Server.executeCommand("aventus.store.connect", options.username, options.password);
		} catch (e) {
			console.log(e)
		}
	}

}