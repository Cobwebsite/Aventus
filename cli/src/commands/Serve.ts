import { Action, ActionOption, ArgOption } from './Action';
import { Server } from '../server/Server';
import { Interaction } from '../interaction/Interaction';
import { ServerStart } from '../server/notification/httpServer/ServerStart';

type ServeOptions = {
}

export class Serve extends Action<ServeOptions> {
	public get name(): string {
		return "serve";
	}
	public get description(): string {
		return "Start live server"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {

	}
	protected registerOptions(addOption: (option: ActionOption<ServeOptions>) => void) {

	}
	public async run(args: string[], options: ServeOptions) {
		try {
			await Interaction.load();
			await Server.load();

			await Server.start({
				loadFiles: true,
				watchFiles: true,
			});

			
			await Server.executeCommand("aventus.liveserver.start");
			const waiting = this.waitStart();
			await waiting;
			await Server.Input({ title: "Press enter to stop server" });
		} catch (e) {
			console.log(e)
		}
	}

	public getAction() {
		// use this because of file splitting
		return Server.notifications.allNotifications[ServerStart.cmd] as typeof ServerStart;
	}

	public waitStart(): Promise<void> {
		return new Promise<void>((resolve) => {
			const fct = (info) => {
				console.log("Server started : " + info)
				const index = this.getAction().callbacks.indexOf(fct);
				if (index != -1) {
					this.getAction().callbacks.splice(index, 1)
				}
				resolve()
			}

			this.getAction().callbacks.push(fct);
		});
	}

}