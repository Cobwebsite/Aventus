import { Action, ActionOption, ArgOption } from './Action';
import { Server } from '../server/Server';
import { resolve } from 'path';
import { LogLevel } from '@server/settings/Settings';
import { Interaction } from '../interaction/Interaction';

type StoreLogoutOptions = {
}

export class StoreLogout extends Action<StoreLogoutOptions> {
	public get name(): string {
		return "store logout";
	}
	public get description(): string {
		return "Logout from the store"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {

	}
	protected registerOptions(addOption: (option: ActionOption<StoreLogoutOptions>) => void) {

	}
	public async run(args: string[], options: StoreLogoutOptions) {
		try {
			await Interaction.load();
			await Server.load();

			await Server.start({
				noStart: true
			});
			await Server.executeCommand("aventus.store.disconnect");
		} catch (e) {
			console.log(e)
		}
	}

}