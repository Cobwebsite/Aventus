import { Action, ActionOption, ArgOption } from './Action';
import { Server } from '../server/Server';
import { Interaction } from '../interaction/Interaction';

type DevOptions = {
}

export class Dev extends Action<DevOptions> {
	public get name(): string {
		return "dev";
	}
	public get description(): string {
		return "Start an interactive cli to dev with your aventus project"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {
		addArg({
			description: "aventus.conf.avt path",
			type: "string",
			typeIsRequired: false
		})
	}
	protected registerOptions(addOption: (option: ActionOption<DevOptions>) => void) {

	}
	public async run(args: string[], options: DevOptions) {
		await Interaction.load();
		await Server.load();
		console.clear();
		await Interaction.init();
		await Server.start({
			onlyBuild: false
		});
		let query = [{
			value: "create",
			name: "Create...",
		},
		{
			value: "log",
			name: "Show logs",
		},
		// {
		//     value: "web",
		//     name: "Run the amazing web interface",
		// }, 
		{
			value: "quit",
			name: "Quit",
		}] as const;

		Interaction.clear();

		while (true) {
			let response = await Interaction.select("Which action shoud I perform?", query)
			if (response == "create") {
				// use this to delay loading file
				await Server.create();
			}
			else if (response == "log") {
				await Interaction.log();
			}
			else if (response == "quit") {
				process.exit(0)
			}
			else {
				console.log("WIP");
			}
			Interaction.clear();
		}
	}

}