import { ProgressLocation, window } from 'vscode';
import { LoadingStart } from './LoadingStart';


export class LoadingStop {
	public static cmd: string = "aventus/stop_loading";

	public static async action(uuid: string, finalText: string = "", delay: number = 0) {
		if (LoadingStart.waitings[uuid]) {
			if (finalText) {
				LoadingStart.progresses[uuid].report({
					message: finalText
				})
			}
			setTimeout(() => {
				LoadingStart.waitings[uuid]();
			}, delay)
		}
	}
}