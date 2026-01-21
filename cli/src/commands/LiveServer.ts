import { Action, ActionOption, ArgOption } from './Action';
import { Server } from '../server/Server';
import { Interaction } from '../interaction/Interaction';
import { ServerStart } from '../server/notification/httpServer/ServerStart';

type LiveServerOptions = {
}

export class LiveServer extends Action<LiveServerOptions> {
	public get name(): string {
		return "serve";
	}
	public get description(): string {
		return "Start live server"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {

	}
	protected registerOptions(addOption: (option: ActionOption<LiveServerOptions>) => void) {

	}
	public async run(args: string[], options: LiveServerOptions) {
		try {
			await Interaction.load();
			await Server.load();

			await Server.start({
				loadFiles: true,
				watchFiles: true,
			});
			await Server.executeCommand("aventus.liveserver.start");

			await this.waitStart();
			await Server.Input({ title: "Press enter to stop server" });
		} catch (e) {
			console.log(e)
		}
	}

	public waitStart(): Promise<void> {
		return new Promise<void>((resolve) => {
			ServerStart.action = (info) => {
				console.log("Server started :" + info)
				resolve()
			}
		});
	}

}