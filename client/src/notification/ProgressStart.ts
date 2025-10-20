import { ProgressLocation, window } from 'vscode';

export class ProgressStart {
	public static cmd: string = "aventus/progress_start";

	public static progress: { [uuid: string]: (arg?: any) => void } = {}

	public static action(uuid: string, text: string) {
		window.withProgress({
			location: ProgressLocation.Notification,
			title: text,
			cancellable: false
		}, () => {
			return new Promise<void>((resolve) => {
				this.progress[uuid] = resolve;
			})
		})
	}
}