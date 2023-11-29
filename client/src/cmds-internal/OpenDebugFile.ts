import { QuickPickOptions, window } from 'vscode';
import { Compiled } from '../notification/Compiled';
import { SelectItem } from '../notification/AskSelect';

export class OpenDebugFile {
	static cmd: string = "aventus.openfile.debug";

	public static async middleware(args: any[]): Promise<void> {
		let builds = Compiled.getBuilds();
		if (builds.length == 0) {
			return
		}
		if (builds.length == 1) {
			Compiled.openDebug(builds[0]);
			return
		}

		let options: SelectItem[] = [];
		for (let build of builds) {
			options.push({
				label: build,
				detail: ""
			})
		}
		let optionsQuickPick: QuickPickOptions = {
			canPickMany: false,
			title: "Choose a build to debug"
		};
		const temp = await window.showQuickPick(options, optionsQuickPick);
		if (temp) {
			Compiled.openDebug(temp.label);
		}
	}
}